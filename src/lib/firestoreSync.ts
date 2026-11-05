import { PendingSync } from './pendingSync';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export type SyncState = 'connecting' | 'synced' | 'syncing' | 'offline' | 'error';

type SyncListener = (state: SyncState, lastSyncTime?: Date) => void;
const syncListeners = new Set<SyncListener>();

const pending = new PendingSync();
let currentSyncState: SyncState = 'connecting';
let lastSyncTimestamp: Date | undefined;

export function subscribeToSyncState(listener: SyncListener): () => void {
  syncListeners.add(listener);
  listener(currentSyncState, lastSyncTimestamp);
  return () => {
    syncListeners.delete(listener);
  };
}

function updateSyncState(state: SyncState) {
  currentSyncState = state;
  if (state === 'synced') {
    lastSyncTimestamp = new Date();
  }
  syncListeners.forEach((l) => {
    try {
      l(state, lastSyncTimestamp);
    } catch (e) {
      console.error('Error in sync listener', e);
    }
  });
}

// Collections to sync
export const SYNC_COLLECTIONS = {
  ACCOUNTS: 'accounts',
  CATEGORIES: 'categories',
  CREDIT_CARDS: 'creditCards',
  CLIENTS: 'clients',
  PROJECTS: 'projects',
  TRANSACTIONS: 'transactions',
  RECURRING: 'recurring',
  GOALS: 'goals',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  USERS: 'users',
} as const;

/**
 * Recursively strip undefined properties to ensure Firestore compatibility.
 * Firestore strictly rejects documents that contain fields with 'undefined' values.
 */
export function sanitizeForFirestore<T>(obj: T): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean;
  }
  return obj;
}

// Save single document to Firestore
export async function firestoreSaveDoc<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<void> {
  const path = `${collectionName}/${data.id}`;
  const token = pending.begin(collectionName, data.id, sanitizeForFirestore(data));
  try {
    updateSyncState('syncing');
    const docRef = doc(db, collectionName, data.id);
    const sanitized = sanitizeForFirestore(data);
    await setDoc(docRef, sanitized);
    pending.finish(collectionName, data.id, token);
    updateSyncState('synced');
  } catch (error) {
    updateSyncState('error');
    console.error(`Error saving to Firestore [${path}]:`, error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Delete single document from Firestore
export async function firestoreDeleteDoc(
  collectionName: string,
  id: string
): Promise<void> {
  const path = `${collectionName}/${id}`;
  const token = pending.begin(collectionName, id, null);
  try {
    updateSyncState('syncing');
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    pending.finish(collectionName, id, token);
    updateSyncState('synced');
  } catch (error) {
    updateSyncState('error');
    console.error(`Error deleting from Firestore [${path}]:`, error);
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Bulk save documents (using batch)
export async function firestoreBulkSaveDocs<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  if (items.length === 0) return;
  const tokens = new Map(items.map(item => [item.id, pending.begin(collectionName, item.id, sanitizeForFirestore(item))]));
  try {
    updateSyncState('syncing');
    // Batches have a 500-op limit
    const chunkSize = 400;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((item) => {
        const docRef = doc(db, collectionName, item.id);
        const sanitized = sanitizeForFirestore(item);
        batch.set(docRef, sanitized);
      });
      await batch.commit();
      chunk.forEach(item => pending.finish(collectionName, item.id, tokens.get(item.id)!));
    }
    updateSyncState('synced');
  } catch (error) {
    updateSyncState('error');
    console.error(`Error bulk saving to Firestore [${collectionName}]:`, error);
    handleFirestoreError(error, OperationType.WRITE, collectionName);
  }
}

// Bulk delete documents
export async function firestoreBulkDeleteDocs(
  collectionName: string,
  ids: string[]
): Promise<void> {
  if (ids.length === 0) return;
  const tokens = new Map(ids.map(id => [id, pending.begin(collectionName, id, null)]));
  try {
    updateSyncState('syncing');
    const chunkSize = 400;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
      });
      await batch.commit();
      chunk.forEach(id => pending.finish(collectionName, id, tokens.get(id)!));
    }
    updateSyncState('synced');
  } catch (error) {
    updateSyncState('error');
    handleFirestoreError(error, OperationType.DELETE, collectionName);
  }
}

// Fetch all documents of a collection once
export async function firestoreFetchAll<T extends { id: string }>(collectionName: string, userId: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(query(colRef, where('userId', '==', userId)));
    return pending.overlay(collectionName, snap.docs.map((d) => d.data() as T));
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
  }
}

// Real-time listener for a collection
export function firestoreSubscribeCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  userId: string
): () => void {
  const colRef = collection(db, collectionName);
  const unsubscribe = onSnapshot(
    query(colRef, where('userId', '==', userId)),
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as T);
      });
      updateSyncState('synced');
      onUpdate(pending.overlay(collectionName, items));
    },
    (error) => {
      updateSyncState('error');
      console.error(`Listener failed for ${collectionName}:`, error);
    }
  );

  return unsubscribe;
}
