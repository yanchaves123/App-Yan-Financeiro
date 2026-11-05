import { scheduleCardPurchase, occurrenceDates, sameOccurrence, dateInMonth, reconcileProjects, validateTransaction, fromCents, toCents, isValidDate } from './finance';
import { getTodayDateString } from './formatters';
import { safeCompare } from './safeCompare';
import {
  Account,
  Category,
  Client,
  CreditCard,
  Goal,
  InAppNotification,
  Project,
  RecurringTransaction,
  ReminderSettings,
  Transaction,
  User,
} from '../types';
import {
  firestoreSaveDoc,
  firestoreDeleteDoc,
  firestoreBulkSaveDocs,
  firestoreBulkDeleteDocs,
  firestoreSubscribeCollection,
  firestoreFetchAll,
  SYNC_COLLECTIONS,
} from './firestoreSync';
import { auth } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const STORAGE_KEYS = {
  USERS: 'fp_users',
  CURRENT_USER: 'fp_current_user',
  ACCOUNTS: 'fp_accounts',
  CATEGORIES: 'fp_categories',
  CREDIT_CARDS: 'fp_credit_cards',
  CLIENTS: 'fp_clients',
  PROJECTS: 'fp_projects',
  TRANSACTIONS: 'fp_transactions',
  RECURRING: 'fp_recurring',
  GOALS: 'fp_goals',
  NOTIFICATIONS: 'fp_notifications',
  REMINDER_SETTINGS: 'fp_reminder_settings',
  THEME: 'fp_theme',
};

// Event listener mechanism for cross-component reactive updates
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyStoreUpdate() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error in store listener', err);
    }
  });
}

export function setStoredSilently<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStoreUpdate();
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

// Default initial categories
export const DEFAULT_CATEGORIES: Omit<Category, 'userId'>[] = [
  // Receitas
  { id: 'cat_inc_1', name: 'Trabalho', type: 'income', color: '#10b981', icon: 'Briefcase', isDefault: true },
  { id: 'cat_inc_2', name: 'Projetos', type: 'income', color: '#059669', icon: 'Video', isDefault: true },
  { id: 'cat_inc_3', name: 'Contratos', type: 'income', color: '#047857', icon: 'FileText', isDefault: true },
  { id: 'cat_inc_4', name: 'Freelance', type: 'income', color: '#14b8a6', icon: 'UserCheck', isDefault: true },
  { id: 'cat_inc_5', name: 'Outros (Receita)', type: 'income', color: '#0d9488', icon: 'PlusCircle', isDefault: true },

  // Despesas Pessoais
  { id: 'cat_exp_p1', name: 'Moradia', type: 'expense_personal', color: '#f97316', icon: 'Home', isDefault: true },
  { id: 'cat_exp_p2', name: 'Alimentação', type: 'expense_personal', color: '#f59e0b', icon: 'Utensils', isDefault: true },
  { id: 'cat_exp_p3', name: 'Transporte', type: 'expense_personal', color: '#3b82f6', icon: 'Car', isDefault: true },
  { id: 'cat_exp_p4', name: 'Saúde', type: 'expense_personal', color: '#ec4899', icon: 'HeartPulse', isDefault: true },
  { id: 'cat_exp_p5', name: 'Lazer', type: 'expense_personal', color: '#8b5cf6', icon: 'Gamepad2', isDefault: true },
  { id: 'cat_exp_p6', name: 'Educação', type: 'expense_personal', color: '#6366f1', icon: 'GraduationCap', isDefault: true },
  { id: 'cat_exp_p7', name: 'Compras', type: 'expense_personal', color: '#d946ef', icon: 'ShoppingBag', isDefault: true },
  { id: 'cat_exp_p8', name: 'Assinaturas', type: 'expense_personal', color: '#06b6d4', icon: 'Tv', isDefault: true },
  { id: 'cat_exp_p9', name: 'Outros (Pessoal)', type: 'expense_personal', color: '#64748b', icon: 'CircleHelp', isDefault: true },

  // Despesas Profissionais (Videomaker / Prestador de Serviços)
  { id: 'cat_exp_pr1', name: 'Equipamentos', type: 'expense_professional', color: '#e11d48', icon: 'Camera', isDefault: true },
  { id: 'cat_exp_pr2', name: 'Software', type: 'expense_professional', color: '#7c3aed', icon: 'Cpu', isDefault: true },
  { id: 'cat_exp_pr3', name: 'Internet & Cloud', type: 'expense_professional', color: '#2563eb', icon: 'Wifi', isDefault: true },
  { id: 'cat_exp_pr4', name: 'Transporte profissional', type: 'expense_professional', color: '#0284c7', icon: 'Compass', isDefault: true },
  { id: 'cat_exp_pr5', name: 'Manutenção', type: 'expense_professional', color: '#ca8a04', icon: 'Wrench', isDefault: true },
  { id: 'cat_exp_pr6', name: 'Marketing', type: 'expense_professional', color: '#ea580c', icon: 'Megaphone', isDefault: true },
  { id: 'cat_exp_pr7', name: 'Serviços terceirizados', type: 'expense_professional', color: '#9333ea', icon: 'Users', isDefault: true },
  { id: 'cat_exp_pr8', name: 'Impostos & Taxas', type: 'expense_professional', color: '#dc2626', icon: 'Receipt', isDefault: true },
  { id: 'cat_exp_pr9', name: 'Outros (Profissional)', type: 'expense_professional', color: '#475569', icon: 'FolderPlus', isDefault: true },
];

export function getCanonicalUserId(email?: string | null): string {
  const normalized = (email || '').trim().toLowerCase();
  if (normalized === 'yanchaves123@gmail.com' || normalized === 'yan' || normalized === '' || !email) {
    return 'usr_1';
  }
  return 'usr_' + normalized.replace(/[^a-z0-9]/g, '_');
}

export function matchesUser(itemUserId?: string, targetUserId?: string): boolean {
  if (!targetUserId) return true;
  if (!itemUserId) return targetUserId === 'usr_1';
  if (itemUserId === targetUserId) return true;
  return false;
}

export const StorageService = {
  // --- USERS & AUTH ---
  getUsers(): User[] {
    return getStored<User[]>(STORAGE_KEYS.USERS, []);
  },

  getCurrentUser(): User | null {
    const stored = getStored<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (!stored) return null;

    // Self-healing: Ensure Yan Chaves or legacy timestamp session is mapped to usr_1
    const canonicalId = getCanonicalUserId(stored.email);
    if (stored.id !== canonicalId) {
      stored.id = canonicalId;
      setStoredSilently(STORAGE_KEYS.CURRENT_USER, stored);
    }
    return stored;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      user.id = getCanonicalUserId(user.email);
    }
    setStored(STORAGE_KEYS.CURRENT_USER, user);
  },

  login(email: string, name?: string): User {
    const canonicalId = getCanonicalUserId(email);
    const users = this.getUsers();
    let existing = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() || u.id === canonicalId
    );
    if (!existing) {
      existing = {
        id: canonicalId,
        name: name || (canonicalId === 'usr_1' ? 'Yan Chaves' : email.split('@')[0]),
        email: email.trim().toLowerCase() || 'yanchaves123@gmail.com',
        profession: 'Videomaker & Produtor Audiovisual',
        createdAt: new Date().toISOString().split('T')[0],
      };
      this.saveUser(existing);
    } else {
      existing.id = canonicalId;
      if (name) existing.name = name;
      this.saveUser(existing);
    }
    this.setCurrentUser(existing);
    this.ensureInitialDataForUser(existing.id);
    return existing;
  },

  logout(): void {
    setStored(STORAGE_KEYS.CURRENT_USER, null);
  },

  saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setStored(STORAGE_KEYS.USERS, users);
    if (this.getCurrentUser()?.id === user.id) {
      this.setCurrentUser(user);
    }
    // The authenticated session creates/updates the user profile after Firebase sign-in.
  },

  // --- ENSURE INITIAL DATA ---
  ensureInitialDataForUser(userId: string): void {
    // Categories
    const allCategories = getStored<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const userCategories = allCategories.filter((c) => c.userId === userId);
    if (userCategories.length === 0) {
      const seeded = DEFAULT_CATEGORIES.map((c) => ({
        ...c,
        id: `${c.id}_${userId}`,
        userId,
      }));
      setStored(STORAGE_KEYS.CATEGORIES, [...allCategories, ...seeded]);
    }

    // Accounts
    const allAccounts = getStored<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    let userAccounts = allAccounts.filter((a) => a.userId === userId);
    if (userAccounts.length === 0) {
      const defaultAccounts: Account[] = [
        {
          id: `acc_nu_${userId}`,
          userId,
          name: 'Nubank',
          type: 'digital',
          initialBalance: 0,
          institution: 'Nubank',
          color: '#820ad1',
          createdAt: new Date().toISOString(),
        },
        {
          id: `acc_bb_${userId}`,
          userId,
          name: 'Banco do Brasil',
          type: 'checking',
          initialBalance: 0,
          institution: 'Banco do Brasil',
          color: '#facc15',
          createdAt: new Date().toISOString(),
        },
        {
          id: `acc_inter_${userId}`,
          userId,
          name: 'Banco Inter',
          type: 'digital',
          initialBalance: 0,
          institution: 'Banco Inter',
          color: '#ff7a00',
          createdAt: new Date().toISOString(),
        },
        {
          id: `acc_mp_${userId}`,
          userId,
          name: 'Mercado Pago',
          type: 'digital',
          initialBalance: 0,
          institution: 'Mercado Pago',
          color: '#009ee3',
          createdAt: new Date().toISOString(),
        },
        {
          id: `acc_cash_${userId}`,
          userId,
          name: 'Dinheiro Físico',
          type: 'cash',
          initialBalance: 0,
          institution: 'Carteira',
          color: '#10b981',
          createdAt: new Date().toISOString(),
        },
      ];
      setStored(STORAGE_KEYS.ACCOUNTS, [...allAccounts, ...defaultAccounts]);
      userAccounts = defaultAccounts;
    } else {
      // Ensure Banco Inter and Mercado Pago exist for existing user sessions
      const hasInterAcc = userAccounts.some((a) => a.institution.toLowerCase().includes('inter') || a.name.toLowerCase().includes('inter'));
      const hasMpAcc = userAccounts.some((a) => a.institution.toLowerCase().includes('mercado') || a.name.toLowerCase().includes('mercado'));
      const extraAccounts: Account[] = [];
      if (!hasInterAcc) {
        extraAccounts.push({
          id: `acc_inter_${userId}`,
          userId,
          name: 'Banco Inter',
          type: 'digital',
          initialBalance: 0,
          institution: 'Banco Inter',
          color: '#ff7a00',
          createdAt: new Date().toISOString(),
        });
      }
      if (!hasMpAcc) {
        extraAccounts.push({
          id: `acc_mp_${userId}`,
          userId,
          name: 'Mercado Pago',
          type: 'digital',
          initialBalance: 0,
          institution: 'Mercado Pago',
          color: '#009ee3',
          createdAt: new Date().toISOString(),
        });
      }
      if (extraAccounts.length > 0) {
        setStored(STORAGE_KEYS.ACCOUNTS, [...allAccounts, ...extraAccounts]);
      }
    }

    // Credit Cards (Nubank, Banco Inter, Mercado Pago)
    const allCards = getStored<CreditCard[]>(STORAGE_KEYS.CREDIT_CARDS, []);
    const userCards = allCards.filter((c) => c.userId === userId);
    const cardsToAdd: CreditCard[] = [];

    const hasNubank = userCards.some((c) => c.institution.toLowerCase().includes('nu') || c.name.toLowerCase().includes('nubank'));
    const hasInter = userCards.some((c) => c.institution.toLowerCase().includes('inter') || c.name.toLowerCase().includes('inter'));
    const hasMercadoPago = userCards.some((c) => c.institution.toLowerCase().includes('mercado') || c.name.toLowerCase().includes('mercado pago'));

    if (!hasNubank) {
      cardsToAdd.push({
        id: `card_nu_${userId}`,
        userId,
        name: 'Nubank Ultravioleta',
        institution: 'Nubank',
        color: '#820ad1',
        limit: 8000,
        closingDay: 5,
        dueDay: 12,
        createdAt: new Date().toISOString(),
      });
    }

    if (!hasInter) {
      cardsToAdd.push({
        id: `card_inter_${userId}`,
        userId,
        name: 'Inter Mastercard Black',
        institution: 'Banco Inter',
        color: '#ff7a00',
        limit: 6000,
        closingDay: 10,
        dueDay: 17,
        createdAt: new Date().toISOString(),
      });
    }

    if (!hasMercadoPago) {
      cardsToAdd.push({
        id: `card_mp_${userId}`,
        userId,
        name: 'Mercado Pago Visa',
        institution: 'Mercado Pago',
        color: '#009ee3',
        limit: 4500,
        closingDay: 3,
        dueDay: 10,
        createdAt: new Date().toISOString(),
      });
    }

    if (cardsToAdd.length > 0) {
      setStored(STORAGE_KEYS.CREDIT_CARDS, [...allCards, ...cardsToAdd]);
    }
  },

  // --- ACCOUNTS ---
  getAccounts(userId?: string): Account[] {
    const list = getStored<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    let hasRepaired = false;
    const sanitized = list.map((a, idx) => {
      if (!a.id || a.id === 'undefined') {
        hasRepaired = true;
        return { ...a, id: `acc_repaired_${Date.now()}_${idx}` };
      }
      return a;
    });
    if (hasRepaired) {
      setStored(STORAGE_KEYS.ACCOUNTS, sanitized);
    }
    if (!userId) return sanitized;
    return sanitized.filter((a) => matchesUser(a.userId, userId));
  },

  saveAccount(account: Account): void {
    const all = this.getAccounts();
    const accountId = account.id && account.id !== 'undefined'
      ? account.id
      : `acc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const safeAccount: Account = { ...account, id: accountId, userId: account.userId || 'usr_1' };
    const index = all.findIndex((a) => a.id === accountId);
    if (index >= 0) {
      all[index] = safeAccount;
    } else {
      all.push(safeAccount);
    }
    setStored(STORAGE_KEYS.ACCOUNTS, all);
    firestoreSaveDoc(SYNC_COLLECTIONS.ACCOUNTS, safeAccount).catch((e) =>
      console.warn('Sync account error', e)
    );
  },

  deleteAccount(accountId: string): void {
    if (this.getTransactions().some(t => t.accountId === accountId || t.destinationAccountId === accountId)
      || this.getRecurring().some(r => r.accountId === accountId)
      || this.getCreditCards().some(c => c.paymentAccountId === accountId)) {
      throw new Error('Esta conta tem lançamentos ou recorrências vinculados. Remova ou transfira os vínculos antes de excluir.');
    }
    const all = this.getAccounts();
    setStored(
      STORAGE_KEYS.ACCOUNTS,
      all.filter((a) => a.id !== accountId)
    );
    firestoreDeleteDoc(SYNC_COLLECTIONS.ACCOUNTS, accountId).catch((e) =>
      console.warn('Sync delete account error', e)
    );
  },

  // --- CATEGORIES ---
  getCategories(userId?: string): Category[] {
    const list = getStored<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    let hasRepaired = false;
    const sanitized = list.map((c, idx) => {
      if (!c.id || c.id === 'undefined') {
        hasRepaired = true;
        return { ...c, id: `cat_repaired_${Date.now()}_${idx}` };
      }
      return c;
    });
    if (hasRepaired) {
      setStored(STORAGE_KEYS.CATEGORIES, sanitized);
    }
    if (!userId) return sanitized;
    return sanitized.filter((c) => matchesUser(c.userId, userId));
  },

  saveCategory(category: Category): void {
    const all = this.getCategories();
    const categoryId = category.id && category.id !== 'undefined'
      ? category.id
      : `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const safeCat: Category = { ...category, id: categoryId, userId: category.userId || 'usr_1' };
    const index = all.findIndex((c) => c.id === categoryId);
    if (index >= 0) {
      all[index] = safeCat;
    } else {
      all.push(safeCat);
    }
    setStored(STORAGE_KEYS.CATEGORIES, all);
    firestoreSaveDoc(SYNC_COLLECTIONS.CATEGORIES, safeCat).catch((e) =>
      console.warn('Sync category error', e)
    );
  },

  deleteCategory(categoryId: string): void {
    const all = this.getCategories();
    setStored(
      STORAGE_KEYS.CATEGORIES,
      all.filter((c) => c.id !== categoryId)
    );
    firestoreDeleteDoc(SYNC_COLLECTIONS.CATEGORIES, categoryId).catch((e) =>
      console.warn('Sync delete category error', e)
    );
  },

  // --- CREDIT CARDS ---
  getCreditCards(userId?: string): CreditCard[] {
    const list = getStored<CreditCard[]>(STORAGE_KEYS.CREDIT_CARDS, []);
    let hasRepaired = false;
    const sanitized = list.map((c, idx) => {
      if (!c.id || c.id === 'undefined') {
        hasRepaired = true;
        return { ...c, id: `card_repaired_${Date.now()}_${idx}` };
      }
      return c;
    });
    if (hasRepaired) {
      setStored(STORAGE_KEYS.CREDIT_CARDS, sanitized);
    }
    if (!userId) return sanitized;
    return sanitized.filter((c) => matchesUser(c.userId, userId));
  },

  saveCreditCard(card: CreditCard): void {
    const all = this.getCreditCards();
    const cardId = card.id && card.id !== 'undefined'
      ? card.id
      : `card_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const safeCard: CreditCard = { ...card, id: cardId, userId: card.userId || 'usr_1' };
    const index = all.findIndex((c) => c.id === cardId);
    if (index >= 0) {
      all[index] = safeCard;
    } else {
      all.push(safeCard);
    }
    setStored(STORAGE_KEYS.CREDIT_CARDS, all);
    firestoreSaveDoc(SYNC_COLLECTIONS.CREDIT_CARDS, safeCard).catch((e) =>
      console.warn('Sync credit card error', e)
    );
  },

  deleteCreditCard(cardId: string): void {
    if (this.getTransactions().some(t => t.creditCardId === cardId) || this.getRecurring().some(r => r.creditCardId === cardId)) {
      throw new Error('Este cartão tem compras ou recorrências vinculadas. Remova os vínculos antes de excluir.');
    }
    const all = this.getCreditCards();
    setStored(
      STORAGE_KEYS.CREDIT_CARDS,
      all.filter((c) => c.id !== cardId)
    );
    firestoreDeleteDoc(SYNC_COLLECTIONS.CREDIT_CARDS, cardId).catch((e) =>
      console.warn('Sync delete credit card error', e)
    );
  },

  // --- CLIENTS ---
  getClients(userId?: string): Client[] {
    const list = getStored<Client[]>(STORAGE_KEYS.CLIENTS, []);
    let hasRepaired = false;
    const sanitized = list.map((c, idx) => {
      if (!c.id || c.id === 'undefined' || typeof c.id !== 'string') {
        hasRepaired = true;
        return { ...c, id: `client_repaired_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}` };
      }
      return c;
    });
    if (hasRepaired) {
      setStored(STORAGE_KEYS.CLIENTS, sanitized);
    }
    if (!userId) return sanitized;
    return sanitized.filter((c) => matchesUser(c.userId, userId));
  },

  saveClient(client: Client): void {
    const all = this.getClients();
    const existingIndex = client.id ? all.findIndex((c) => c.id === client.id) : -1;
    const clientId = existingIndex >= 0
      ? client.id
      : `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const safeClient: Client = {
      ...client,
      id: clientId,
      userId: client.userId || 'usr_1',
    };

    if (existingIndex >= 0) {
      all[existingIndex] = safeClient;
    } else {
      all.push(safeClient);
    }
    setStored(STORAGE_KEYS.CLIENTS, all);
    firestoreSaveDoc(SYNC_COLLECTIONS.CLIENTS, safeClient).catch((e) =>
      console.warn('Sync client error', e)
    );
  },

  deleteClient(clientId: string): void {
    const all = this.getClients();
    setStored(
      STORAGE_KEYS.CLIENTS,
      all.filter((c) => c.id !== clientId)
    );
    firestoreDeleteDoc(SYNC_COLLECTIONS.CLIENTS, clientId).catch((e) =>
      console.warn('Sync delete client error', e)
    );
  },

  // --- PROJECTS ---
  getProjects(userId?: string): Project[] {
    const list = getStored<Project[]>(STORAGE_KEYS.PROJECTS, []);
    if (!userId) return list;
    return list.filter((p) => matchesUser(p.userId, userId));
  },

  saveProject(project: Project): void {
    const all = this.getProjects();
    const safeProject: Project = { ...project, userId: project.userId || 'usr_1' };
    const index = all.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      all[index] = safeProject;
    } else {
      all.push(safeProject);
    }
    setStored(STORAGE_KEYS.PROJECTS, all);
    firestoreSaveDoc(SYNC_COLLECTIONS.PROJECTS, safeProject).catch((e) =>
      console.warn('Sync project error', e)
    );
  },

  deleteProject(projectId: string): void {
    const all = this.getProjects();
    setStored(
      STORAGE_KEYS.PROJECTS,
      all.filter((p) => p.id !== projectId)
    );
    firestoreDeleteDoc(SYNC_COLLECTIONS.PROJECTS, projectId).catch((e) =>
      console.warn('Sync delete project error', e)
    );
  },

  // --- TRANSACTIONS ---
  getTransactions(userId?: string): Transaction[] {
    const list = getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    if (!userId) return list;
    return list.filter((t) => matchesUser(t.userId, userId));
  },

  commitTransactionChanges(before: Transaction[], after: Transaction[]): void {
    const projects = this.getProjects();
    const reconciled = reconcileProjects(projects, before, after);
    // Validate all changes before writing either collection.
    setStored(STORAGE_KEYS.TRANSACTIONS, after);
    for (let i = 0; i < projects.length; i++) {
      if (projects[i] !== reconciled[i]) this.saveProject(reconciled[i]);
    }
  },

  saveTransaction(transaction: Transaction): void {
    const all = this.getTransactions();
    const safeTx = scheduleCardPurchase({ ...transaction, amount: fromCents(toCents(transaction.amount)), userId: transaction.userId || 'usr_1' }, this.getCreditCards(transaction.userId).find(c => c.id === transaction.creditCardId), all.find(t => t.id === transaction.id));
    validateTransaction(safeTx, this.getAccounts(safeTx.userId));
    const before = [...all];
    const previous = all.find(t => t.id === safeTx.id);
    if (previous?.isCardInvoicePayment && (previous.amount !== safeTx.amount || previous.type !== safeTx.type || previous.paymentMethod !== safeTx.paymentMethod || previous.creditCardId !== safeTx.creditCardId)) throw new Error('Exclua o registro de pagamento da fatura para corrigir seu valor.');
    if (previous?.invoicePaid && (previous.amount !== safeTx.amount || previous.date !== safeTx.date || previous.creditCardId !== safeTx.creditCardId || previous.status !== safeTx.status || previous.paymentMethod !== safeTx.paymentMethod)) {
      throw new Error('Estorne o pagamento da fatura antes de alterar uma compra já quitada.');
    }
    if (previous?.isCardInvoicePayment && previous.status !== safeTx.status) {
      const restored = all.map(t => t.invoicePaymentId === previous.id ? { ...t, invoicePaid: safeTx.status === 'completed' } : t);
      const changed = restored.filter(t => t.invoicePaymentId === previous.id);
      if (changed.length) firestoreBulkSaveDocs(SYNC_COLLECTIONS.TRANSACTIONS, changed).catch(console.warn);
      for (let i = 0; i < all.length; i++) all[i] = restored[i];
    }
    const index = all.findIndex((t) => t.id === safeTx.id);
    if (index >= 0) {
      all[index] = safeTx;
    } else {
      all.push(safeTx);
    }
    this.commitTransactionChanges(before, all);
    firestoreSaveDoc(SYNC_COLLECTIONS.TRANSACTIONS, safeTx).catch((e) =>
      console.warn('Sync transaction error', e)
    );
  },

  saveTransactionsBulk(transactions: Transaction[], preserveInvoiceDates = false): void {
    const all = this.getTransactions();
    if (!preserveInvoiceDates) transactions = transactions.map(t => scheduleCardPurchase(t, this.getCreditCards(t.userId).find(c => c.id === t.creditCardId), all.find(old => old.id === t.id)));
    transactions.forEach(t => {
      validateTransaction(t, this.getAccounts(t.userId));
      const previous = all.find(old=>old.id===t.id);
      if(previous && previous.userId !== t.userId) throw new Error('O lançamento pertence a outra conta.');
      if(t.creditCardId && !this.getCreditCards(t.userId).some(c=>c.id===t.creditCardId)) throw new Error('Cartão inválido no lançamento.');
      if(previous?.isCardInvoicePayment && (previous.amount!==t.amount || previous.type!==t.type || previous.paymentMethod!==t.paymentMethod)) throw new Error('Exclua o registro de pagamento da fatura para corrigir seu valor.');
      if(previous?.invoicePaid && (previous.amount!==t.amount || previous.date!==t.date || previous.creditCardId!==t.creditCardId || previous.status!==t.status || previous.paymentMethod!==t.paymentMethod || previous.invoicePaid!==t.invoicePaid)) throw new Error('Estorne a fatura antes de alterar uma compra quitada.');
    });
    const newItemsMap = new Map(transactions.map((t) => [t.id, t]));
    const updated = all.map((t) => (newItemsMap.has(t.id) ? newItemsMap.get(t.id)! : t));
    const existingIds = new Set(all.map((t) => t.id));
    for (const t of newItemsMap.values()) {
      if (!existingIds.has(t.id)) {
        updated.push(t);
      }
    }
    this.commitTransactionChanges(all, updated);
    firestoreBulkSaveDocs(SYNC_COLLECTIONS.TRANSACTIONS, transactions).catch((e) =>
      console.warn('Sync bulk transactions error', e)
    );
  },

  deleteTransaction(transactionId: string): void {
    const all = this.getTransactions();
    const removed = all.find(t => t.id === transactionId);
    if (removed?.invoicePaid) throw new Error('Estorne o pagamento da fatura antes de excluir uma compra quitada.');
    const restored = all.filter(t => t.id !== transactionId).map(t => {
      if (removed?.isCardInvoicePayment && t.invoicePaymentId === removed.id) {
        const { invoicePaymentId, ...purchase } = t;
        return { ...purchase, invoicePaid: false };
      }
      return t;
    });
    this.commitTransactionChanges(all, restored);
    const changed = restored.filter(t => all.find(previous => previous.id === t.id) !== t);
    if (changed.length) firestoreBulkSaveDocs(SYNC_COLLECTIONS.TRANSACTIONS, changed).catch(console.warn);
    firestoreDeleteDoc(SYNC_COLLECTIONS.TRANSACTIONS, transactionId).catch((e) =>
      console.warn('Sync delete transaction error', e)
    );
  },

  deleteTransactionsBulk(transactionIds: string[]): void {
    const idsSet = new Set(transactionIds);
    const all = this.getTransactions();
    if (all.some(t => idsSet.has(t.id) && t.invoicePaid && !idsSet.has(t.invoicePaymentId || ''))) {
      throw new Error('Estorne o pagamento da fatura antes de excluir uma compra quitada.');
    }
    const restored = all.filter(t => !idsSet.has(t.id)).map(t => {
      if (t.invoicePaymentId && idsSet.has(t.invoicePaymentId)) {
        const { invoicePaymentId, ...purchase } = t;
        return { ...purchase, invoicePaid: false };
      }
      return t;
    });
    this.commitTransactionChanges(all, restored);
    const changed = restored.filter(t => all.find(old => old.id === t.id) !== t);
    if (changed.length) firestoreBulkSaveDocs(SYNC_COLLECTIONS.TRANSACTIONS, changed).catch(console.warn);
    firestoreBulkDeleteDocs(SYNC_COLLECTIONS.TRANSACTIONS, transactionIds).catch((e) =>
      console.warn('Sync bulk delete transactions error', e)
    );
  },

  // --- RECURRING TRANSACTIONS ---
  getRecurring(userId?: string): RecurringTransaction[] {
    const list = getStored<RecurringTransaction[]>(STORAGE_KEYS.RECURRING, []);
    if (!userId) return list;
    return list.filter((r) => matchesUser(r.userId, userId));
  },

  saveRecurring(item: RecurringTransaction, generateOccurrences: boolean = true, monthsAhead: number = 6): void {
    const all = this.getRecurring();
    const safeItem: RecurringTransaction = { ...item, userId: item.userId || 'usr_1' };
    const index = all.findIndex((r) => r.id === safeItem.id);
    if (index >= 0) {
      all[index] = safeItem;
    } else {
      all.push(safeItem);
    }
    setStored(STORAGE_KEYS.RECURRING, all);
    firestoreSaveDoc(SYNC_COLLECTIONS.RECURRING, safeItem).catch((e) =>
      console.warn('Sync recurring error', e)
    );

    const today = getTodayDateString();
    const txs = this.getTransactions(item.userId);
    const futurePending = txs.filter(t => t.recurrenceId === item.id && t.status === 'pending' && t.date >= today);
    if (!item.active) {
      this.deleteTransactionsBulk(futurePending.map(t => t.id));
      return;
    }
    const updated = futurePending.map(t => ({
      ...t, description: item.description, amount: item.amount,
      date: item.periodicity === 'monthly' ? dateInMonth((t.purchaseDate || t.date).slice(0, 7), item.dueDay || Number((t.purchaseDate || t.date).slice(8))) : (t.purchaseDate || t.date),
      purchaseDate: item.creditCardId ? (item.periodicity === 'monthly' ? dateInMonth((t.purchaseDate || t.date).slice(0, 7), item.dueDay || Number((t.purchaseDate || t.date).slice(8))) : (t.purchaseDate || t.date)) : undefined,
      categoryId: item.categoryId, accountId: item.accountId,
      creditCardId: item.creditCardId, clientId: item.clientId,
      paymentMethod: item.paymentMethod || (item.creditCardId ? 'credit_card' : 'bank_slip'),
    } as Transaction));
    if (updated.length) this.saveTransactionsBulk(updated);
    if (generateOccurrences) this.generateOccurrencesForRecurring(item.id, monthsAhead);
  },

  toggleRecurringActive(id: string): void {
    const item = this.getRecurring().find(r => r.id === id);
    if (item) this.saveRecurring({ ...item, active: !item.active }, true, 6);
  },

  deleteRecurring(id: string, deleteFutureTransactions: boolean = true): void {
    const all = this.getRecurring();
    setStored(
      STORAGE_KEYS.RECURRING,
      all.filter((r) => r.id !== id)
    );
    firestoreDeleteDoc(SYNC_COLLECTIONS.RECURRING, id).catch((e) =>
      console.warn('Sync delete recurring error', e)
    );

    if (deleteFutureTransactions) {
      const txs = this.getTransactions();
      const today = getTodayDateString();
      this.deleteTransactionsBulk(txs.filter(t => t.recurrenceId === id && t.date >= today && t.status !== 'completed').map(t => t.id));
    }
  },

  generateOccurrencesForRecurring(recurrenceId: string, monthsAhead: number = 6): void {
    const allRecurring = this.getRecurring();
    const item = allRecurring.find((r) => r.id === recurrenceId);
    if (!item || !item.active) return;

    const existingTxs = this.getTransactions(item.userId);
    const today = getTodayDateString();
    const generated: Transaction[] = [];
    for (const targetDate of occurrenceDates(item, today, monthsAhead)) {
      if (existingTxs.some(t => t.id === `tx_rec_${item.id}_${item.periodicity === 'monthly' ? targetDate.slice(0, 7) : targetDate}` || (t.recurrenceId === item.id && sameOccurrence(item, targetDate, t.purchaseDate || t.date)))) continue;
      const key = item.periodicity === 'monthly' ? targetDate.slice(0, 7) : targetDate;
      generated.push({
        id: `tx_rec_${item.id}_${key}`, userId: item.userId, type: item.type,
        description: item.description, amount: item.amount, date: targetDate,
        categoryId: item.categoryId, accountId: item.accountId, creditCardId: item.creditCardId,
        paymentMethod: item.paymentMethod || (item.creditCardId ? 'credit_card' : 'bank_slip'),
        clientId: item.clientId, status: 'pending', isRecurring: true,
        recurrenceId: item.id, isDemo: item.isDemo, createdAt: new Date().toISOString(),
      });
    }

    if (generated.length > 0) {
      this.saveTransactionsBulk(generated);
    }
  },

  postRecurringToMonth(recurrenceId: string, yearMonth: string): { success: boolean; message: string; transaction?: Transaction } {
    const item = this.getRecurring().find((r) => r.id === recurrenceId);
    if (!item) return { success: false, message: 'Recorrência não encontrada' };

    const txs = this.getTransactions();
    const existing = txs.find((t) => t.recurrenceId === recurrenceId && t.date.startsWith(yearMonth));

    if (existing) {
      if (existing.status === 'completed') {
        return {
          success: true,
          message: `O lançamento de "${item.description}" já estava confirmado e pago no mês selecionado.`,
          transaction: existing,
        };
      }
      const updated: Transaction = {
        ...existing,
        status: 'completed',
        amount: item.amount,
        description: item.description,
      };
      this.saveTransaction(updated);
      return {
        success: true,
        message: `Lançamento "${item.description}" confirmado como Pago neste mês!`,
        transaction: updated,
      };
    }

    const dueDayNum = item.dueDay || 10;
    const occurrenceDate = dateInMonth(yearMonth, dueDayNum);
    const newTx: Transaction = {
      id: `tx_rec_${item.id}_${yearMonth}`,
      userId: item.userId,
      type: item.type,
      description: item.description,
      amount: item.amount,
      date: occurrenceDate,
      categoryId: item.categoryId,
      accountId: item.accountId,
      creditCardId: item.creditCardId,
      paymentMethod: item.paymentMethod || (item.creditCardId ? 'credit_card' : 'bank_slip'),
      clientId: item.clientId,
      status: 'completed',
      isRecurring: true,
      recurrenceId: item.id,
      isDemo: item.isDemo,
      createdAt: new Date().toISOString(),
    };
    this.saveTransaction(newTx);
    return {
      success: true,
      message: `Lançamento "${item.description}" criado e confirmado como Pago em ${yearMonth}!`,
      transaction: newTx,
    };
  },

  getRecurrenceOccurrences(recurrenceId: string): Transaction[] {
    const txs = this.getTransactions();
    return txs
      .filter((t) => t.recurrenceId === recurrenceId)
      .sort((a, b) => safeCompare(b.date, a.date));
  },

  syncAllRecurrences(userId: string, monthsAhead: number = 6): void {
    const list = this.getRecurring(userId);
    list.filter((r) => r.active).forEach((r) => {
      this.generateOccurrencesForRecurring(r.id, monthsAhead);
    });
  },

  // --- GOALS ---
  getGoals(userId?: string): Goal[] {
    const list = getStored<Goal[]>(STORAGE_KEYS.GOALS, []);
    if (!userId) return list;
    return list.filter((g) => matchesUser(g.userId, userId));
  },

  saveGoal(goal: Goal): void {
    const all = this.getGoals();
    const goalId = goal.id && goal.id !== 'undefined'
      ? goal.id
      : `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const safeGoal: Goal = { ...goal, id: goalId, userId: goal.userId || 'usr_1' };
    const index = all.findIndex((g) => g.id === goalId);
    if (index >= 0) {
      all[index] = safeGoal;
    } else {
      all.push(safeGoal);
    }
    setStored(STORAGE_KEYS.GOALS, all);
    firestoreSaveDoc(SYNC_COLLECTIONS.GOALS, safeGoal).catch((e) =>
      console.warn('Sync goal error', e)
    );
  },

  deleteGoal(goalId: string): void {
    const all = this.getGoals();
    setStored(
      STORAGE_KEYS.GOALS,
      all.filter((g) => g.id !== goalId)
    );
    firestoreDeleteDoc(SYNC_COLLECTIONS.GOALS, goalId).catch((e) =>
      console.warn('Sync delete goal error', e)
    );
  },

  // --- NOTIFICATIONS ---
  getNotifications(userId?: string): InAppNotification[] {
    const list = getStored<InAppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    if (!userId) return list;
    return list.filter((n) => matchesUser(n.userId, userId));
  },

  saveNotification(notification: InAppNotification): void {
    const all = this.getNotifications();
    const index = all.findIndex(n => n.id === notification.id);
    if (index >= 0) all.splice(index, 1);
    all.unshift(notification);
    setStored(STORAGE_KEYS.NOTIFICATIONS, all.slice(0, 50));
    firestoreSaveDoc(SYNC_COLLECTIONS.NOTIFICATIONS, notification).catch((e) =>
      console.warn('Sync notification error', e)
    );
  },

  markNotificationRead(notificationId: string): void {
    const all = this.getNotifications();
    const item = all.find((n) => n.id === notificationId);
    if (item) {
      item.read = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, all);
      firestoreSaveDoc(SYNC_COLLECTIONS.NOTIFICATIONS, item).catch(console.warn);
    }
  },

  markAllNotificationsRead(userId: string): void {
    const all = this.getNotifications();
    all.forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, all);
    firestoreBulkSaveDocs(SYNC_COLLECTIONS.NOTIFICATIONS, all.filter(n => n.userId === userId)).catch(console.warn);
  },

  // --- REMINDER SETTINGS ---
  getReminderSettings(): ReminderSettings {
    const defaultSettings: ReminderSettings = {
      enabled: true,
      times: ['08:00', '12:00', '20:00'],
      soundEnabled: true,
      vibrateEnabled: true,
      lastTriggered: {},
    };
    const stored = getStored<ReminderSettings & {userId?: string}>(STORAGE_KEYS.REMINDER_SETTINGS, defaultSettings);
    const owner = this.getCurrentUser()?.id;
    return stored.userId && stored.userId !== owner ? defaultSettings : { ...defaultSettings, ...stored };
  },

  saveReminderSettings(settings: ReminderSettings): void {
    const userId = this.getCurrentUser()?.id;
    setStored(STORAGE_KEYS.REMINDER_SETTINGS, { ...settings, userId });
    if (!userId || !auth.currentUser) return;
    firestoreSaveDoc(SYNC_COLLECTIONS.SETTINGS, { id: `settings_${auth.currentUser?.uid}`, userId: this.getCurrentUser()?.id, ...settings }).catch((e) =>
      console.warn('Sync settings error', e)
    );
  },

  recordReminderTriggered(timeSlot: string, dateStr: string): void {
    const current = this.getReminderSettings();
    const updated: ReminderSettings = {
      ...current,
      lastTriggered: {
        ...(current.lastTriggered || {}),
        [timeSlot]: dateStr,
      },
    };
    this.saveReminderSettings(updated);
  },

  // --- DEMO DATA HANDLING ---
  // Demonstrates full videographer workflow without cluttering user data permanently
  loadDemoData(userId: string): void {
    this.ensureInitialDataForUser(userId);
    const accounts = this.getAccounts(userId);
    const categories = this.getCategories(userId);
    const cards = this.getCreditCards(userId);

    const nubank = accounts.find((a) => a.institution.toLowerCase().includes('nu')) || accounts[0];
    const bb = accounts.find((a) => a.institution.toLowerCase().includes('brasil')) || accounts[1];
    const cardNubank = cards.find((c) => c.institution.toLowerCase().includes('nu') || c.name.toLowerCase().includes('nu')) || cards[0];
    const cardInter = cards.find((c) => c.institution.toLowerCase().includes('inter') || c.name.toLowerCase().includes('inter')) || cards[1] || cards[0];
    const cardMp = cards.find((c) => c.institution.toLowerCase().includes('mercado') || c.name.toLowerCase().includes('mercado')) || cards[2] || cards[0];

    // Find categories
    const catProjetos = categories.find((c) => c.name === 'Projetos')?.id || categories[0]?.id;
    const catContratos = categories.find((c) => c.name === 'Contratos')?.id || categories[0]?.id;
    const catEquip = categories.find((c) => c.name === 'Equipamentos')?.id || categories[1]?.id;
    const catSoftware = categories.find((c) => c.name === 'Software')?.id || categories[1]?.id;
    const catAlimentacao = categories.find((c) => c.name === 'Alimentação')?.id || categories[2]?.id;
    const catTransporte = categories.find((c) => c.name === 'Transporte profissional')?.id || categories[2]?.id;
    const catMoradia = categories.find((c) => c.name === 'Moradia')?.id || categories[2]?.id;

    // Demo Clients
    const demoClient1: Client = {
      id: `client_pref_${userId}`,
      userId,
      name: 'Prefeitura Municipal',
      company: 'Secretaria de Cultura e Turismo',
      phone: '(19) 98765-4321',
      email: 'cultura@prefeitura.gov.br',
      city: 'Campinas, SP',
      notes: 'Cliente para eventos oficiais e coberturas audiovisuais de grande porte.',
      createdAt: '2026-08-01',
    };

    const demoClient2: Client = {
      id: `client_academia_${userId}`,
      userId,
      name: 'Academia FitCorp',
      company: 'FitCorp Centro de Treinamento',
      phone: '(19) 99123-8899',
      email: 'contato@fitcorp.com.br',
      city: 'Campinas, SP',
      notes: 'Contrato mensal de produção de 12 Reels + 2 vídeos para YouTube.',
      createdAt: '2026-07-15',
    };

    const demoClient3: Client = {
      id: `client_casal_${userId}`,
      userId,
      name: 'Lucas & Mariana',
      company: 'Casamento Lucas e Mariana',
      phone: '(11) 97766-5544',
      email: 'lucas.mariana2026@gmail.com',
      city: 'São Paulo, SP',
      notes: 'Filme de casamento completo em 4K com teaser em 48h.',
      createdAt: '2026-08-20',
    };

    this.saveClient({...demoClient1, isDemo: true});
    this.saveClient({...demoClient2, isDemo: true});
    this.saveClient({...demoClient3, isDemo: true});

    // Demo Projects
    const demoProject1: Project = {
      id: `proj_peao_${userId}`,
      userId,
      clientId: demoClient1.id,
      name: 'Vídeos Festa do Peão 2026',
      description: 'Cobertura em tempo real de 3 dias, captação com drone e 5 Reels diários.',
      totalValue: 3000,
      projectDate: '2026-09-10',
      paymentDeadline: '2026-09-28',
      status: 'waiting_payment',
      paymentMethod: 'pix',
      receivedValue: 1500,
      pendingValue: 1500,
      notes: 'Primeira parcela de 50% paga na contratação. Restante no fechamento.',
      createdAt: '2026-09-02',
    };

    const demoProject2: Project = {
      id: `proj_fitcorp_${userId}`,
      userId,
      clientId: demoClient2.id,
      name: 'Pacote Mensal Vídeos Setembro',
      description: 'Produção mensal de vídeos fitness para redes sociais.',
      totalValue: 2400,
      projectDate: '2026-09-01',
      paymentDeadline: '2026-09-15',
      status: 'paid',
      paymentMethod: 'pix',
      receivedValue: 2400,
      pendingValue: 0,
      notes: 'Contrato recorrente pago pontualmente.',
      createdAt: '2026-09-01',
    };

    const demoProject3: Project = {
      id: `proj_casamento_${userId}`,
      userId,
      clientId: demoClient3.id,
      name: 'Filme de Casamento Lucas & Mariana',
      description: 'Captação pré-wedding + cerimônia e recepção com 2 câmeras.',
      totalValue: 5500,
      projectDate: '2026-09-20',
      paymentDeadline: '2026-10-10',
      status: 'in_progress',
      paymentMethod: 'bank_slip',
      receivedValue: 2750,
      pendingValue: 2750,
      notes: 'Sinal de 50% recebido; saldo restante na entrega do vídeo final.',
      createdAt: '2026-08-25',
    };

    this.saveProject({...demoProject1, isDemo: true});
    this.saveProject({...demoProject2, isDemo: true});
    this.saveProject({...demoProject3, isDemo: true});

    // Demo Goals
    const demoGoal1: Goal = {
      id: `goal_sony_${userId}`,
      userId,
      name: 'Comprar Sony FX30 + Lente 24-70mm',
      targetValue: 12000,
      currentValue: 6500,
      deadline: '2026-12-31',
      linkedAccountId: nubank?.id,
      notes: 'Upgrade essencial para cinema line e gravação em 10-bit 4:2:2.',
      isDemo: true,
      createdAt: '2026-08-01',
    };

    const demoGoal2: Goal = {
      id: `goal_reserva_${userId}`,
      userId,
      name: 'Reserva de Emergência (6 Meses)',
      targetValue: 25000,
      currentValue: 18500,
      deadline: '2027-06-30',
      linkedAccountId: bb?.id,
      notes: 'Segurança financeira para cobrir custos fixos em meses de baixa.',
      isDemo: true,
      createdAt: '2026-06-01',
    };

    this.saveGoal(demoGoal1);
    this.saveGoal(demoGoal2);

    // Demo Recurring Transactions (Subscriptions & Retainer Contract)
    const demoRec1: RecurringTransaction = {
      id: `rec_adobe_${userId}`,
      userId,
      type: 'expense',
      description: 'Adobe Creative Cloud (Premiere, After Effects)',
      amount: 289.0,
      periodicity: 'monthly',
      dueDay: 8,
      categoryId: catSoftware,
      creditCardId: cardNubank?.id,
      paymentMethod: 'credit_card',
      startDate: '2026-01-08',
      active: true,
      isDemo: true,
      createdAt: '2026-01-08T08:00:00',
    };

    const demoRec2: RecurringTransaction = {
      id: `rec_net_${userId}`,
      userId,
      type: 'expense',
      description: 'Internet Fibra 1GB (Upload de Vídeos)',
      amount: 160.0,
      periodicity: 'monthly',
      dueDay: 25,
      categoryId: catSoftware,
      accountId: nubank?.id,
      paymentMethod: 'bank_slip',
      startDate: '2026-01-25',
      active: true,
      isDemo: true,
      createdAt: '2026-01-25T08:00:00',
    };

    const demoRec3: RecurringTransaction = {
      id: `rec_fitcorp_${userId}`,
      userId,
      type: 'income',
      description: 'Contrato Mensal Academia FitCorp (12 Reels/mês)',
      amount: 2400.0,
      periodicity: 'monthly',
      dueDay: 5,
      categoryId: catContratos,
      accountId: nubank?.id,
      paymentMethod: 'pix',
      clientId: demoClient2.id,
      startDate: '2026-07-05',
      active: true,
      isDemo: true,
      createdAt: '2026-07-05T08:00:00',
    };

    this.saveRecurring({...demoRec1, createdAt: new Date().toISOString()}, false);
    this.saveRecurring({...demoRec2, createdAt: new Date().toISOString()}, false);
    this.saveRecurring({...demoRec3, createdAt: new Date().toISOString()}, false);

    // Demo Transactions for Current Month (2026-09) and previous months to show evolution
    const demoTransactions: Transaction[] = [
      // Current Month Incomes
      {
        id: `tx_inc_1_${userId}`,
        userId,
        type: 'income',
        description: 'Sinal Festa do Peão (50%)',
        amount: 1500,
        date: '2026-09-02',
        categoryId: catProjetos,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        clientId: demoClient1.id,
        projectId: demoProject1.id,
        status: 'completed',
        isDemo: true,
        createdAt: '2026-09-02T10:00:00',
      },
      {
        id: `tx_inc_2_${userId}`,
        userId,
        type: 'income',
        description: 'Mensalidade FitCorp Setembro',
        amount: 2400,
        date: '2026-09-05',
        categoryId: catContratos,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        clientId: demoClient2.id,
        projectId: demoProject2.id,
        status: 'completed',
        isDemo: true,
        createdAt: '2026-09-05T14:30:00',
      },
      {
        id: `tx_inc_3_${userId}`,
        userId,
        type: 'income',
        description: 'Sinal Casamento Lucas & Mariana',
        amount: 2750,
        date: '2026-09-12',
        categoryId: catProjetos,
        accountId: bb?.id,
        paymentMethod: 'transfer',
        clientId: demoClient3.id,
        projectId: demoProject3.id,
        status: 'completed',
        isDemo: true,
        createdAt: '2026-09-12T11:00:00',
      },
      // Pending Income (Contas a Receber)
      {
        id: `tx_inc_pend1_${userId}`,
        userId,
        type: 'income',
        description: 'Segunda Parcela Festa do Peão',
        amount: 1500,
        date: '2026-09-28',
        categoryId: catProjetos,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        clientId: demoClient1.id,
        projectId: demoProject1.id,
        status: 'pending',
        isDemo: true,
        createdAt: '2026-09-02T10:05:00',
      },
      {
        id: `tx_inc_pend2_${userId}`,
        userId,
        type: 'income',
        description: 'Segunda Parcela Casamento Lucas & Mariana',
        amount: 2750,
        date: '2026-10-10',
        categoryId: catProjetos,
        accountId: bb?.id,
        paymentMethod: 'pix',
        clientId: demoClient3.id,
        projectId: demoProject3.id,
        status: 'pending',
        isDemo: true,
        createdAt: '2026-09-12T11:05:00',
      },

      // Current Month Expenses (Completed)
      {
        id: `tx_exp_1_${userId}`,
        userId,
        type: 'expense',
        description: 'Adobe Creative Cloud (Premiere, After Effects)',
        amount: 289.0,
        date: '2026-09-08',
        categoryId: catSoftware,
        accountId: nubank?.id,
        paymentMethod: 'credit_card',
        creditCardId: cardNubank?.id,
        status: 'completed',
        isRecurring: true,
        isDemo: true,
        createdAt: '2026-09-08T08:00:00',
      },
      {
        id: `tx_exp_inter_${userId}`,
        userId,
        type: 'expense',
        description: 'Gimbal Estabilizador DJI RS3 (Inter Shop)',
        amount: 620.0,
        date: '2026-09-14',
        categoryId: catEquip,
        paymentMethod: 'credit_card',
        creditCardId: cardInter?.id,
        status: 'completed',
        isDemo: true,
        createdAt: '2026-09-14T10:30:00',
      },
      {
        id: `tx_exp_mp_${userId}`,
        userId,
        type: 'expense',
        description: 'Cartão de Memória SanDisk 128GB V90 (Mercado Pago)',
        amount: 280.0,
        date: '2026-09-16',
        categoryId: catEquip,
        paymentMethod: 'credit_card',
        creditCardId: cardMp?.id,
        status: 'completed',
        isDemo: true,
        createdAt: '2026-09-16T15:20:00',
      },
      {
        id: `tx_exp_2_${userId}`,
        userId,
        type: 'expense',
        description: 'Combustível Locação Captação',
        amount: 180.0,
        date: '2026-09-10',
        categoryId: catTransporte,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-09-10T09:15:00',
      },
      {
        id: `tx_exp_3_${userId}`,
        userId,
        type: 'expense',
        description: 'Supermercado e Alimentação',
        amount: 850.0,
        date: '2026-09-11',
        categoryId: catAlimentacao,
        accountId: bb?.id,
        paymentMethod: 'debit_card',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-09-11T19:00:00',
      },
      {
        id: `tx_exp_4_${userId}`,
        userId,
        type: 'expense',
        description: 'Aluguel do Estúdio e Escritório',
        amount: 1800.0,
        date: '2026-09-15',
        categoryId: catMoradia,
        accountId: bb?.id,
        paymentMethod: 'bank_slip',
        status: 'completed',
        isRecurring: true,
        isDemo: true,
        createdAt: '2026-09-15T09:00:00',
      },

      // Credit card installment demonstration: Câmera R$ 6.000 em 12 parcelas de R$ 500
      {
        id: `tx_inst_1_${userId}`,
        userId,
        type: 'expense',
        description: 'Câmera Sony A7 IV (Parcela 03/12)',
        amount: 500.0,
        date: '2026-09-12',
        categoryId: catEquip,
        paymentMethod: 'credit_card',
        creditCardId: cardNubank?.id,
        installmentCurrent: 3,
        installmentTotal: 12,
        parentPurchaseId: `purchase_cam_${userId}`,
        status: 'completed',
        isDemo: true,
        createdAt: '2026-07-12T15:00:00',
      },

      // Contas a Pagar (Pending / Overdue)
      {
        id: `tx_pay_pend1_${userId}`,
        userId,
        type: 'expense',
        description: 'Internet Fibra 1GB (Upload de Vídeos)',
        amount: 160.0,
        date: '2026-09-25',
        categoryId: catSoftware,
        accountId: nubank?.id,
        paymentMethod: 'bank_slip',
        status: 'pending',
        isRecurring: true,
        isDemo: true,
        createdAt: '2026-09-01T08:00:00',
      },
      {
        id: `tx_pay_pend2_${userId}`,
        userId,
        type: 'expense',
        description: 'Fatura Cartão de Crédito Nubank',
        amount: 789.0,
        date: '2026-09-28',
        categoryId: catEquip,
        accountId: nubank?.id,
        paymentMethod: 'bank_slip',
        status: 'pending',
        isDemo: true,
        createdAt: '2026-09-12T08:00:00',
      },
      {
        id: `tx_pay_overdue_${userId}`,
        userId,
        type: 'expense',
        description: 'Seguro de Equipamentos Cinematográficos',
        amount: 220.0,
        date: '2026-09-20',
        categoryId: catEquip,
        accountId: bb?.id,
        paymentMethod: 'bank_slip',
        status: 'overdue',
        isDemo: true,
        createdAt: '2026-09-01T08:00:00',
      },

      // Historical data for 6-month chart
      // August 2026
      {
        id: `tx_hist_aug1_${userId}`,
        userId,
        type: 'income',
        description: 'Vídeo Institucional Unimed',
        amount: 6800,
        date: '2026-08-15',
        categoryId: catProjetos,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-08-15T10:00:00',
      },
      {
        id: `tx_hist_aug2_${userId}`,
        userId,
        type: 'expense',
        description: 'Despesas Gerais e Aluguel Agosto',
        amount: 3950,
        date: '2026-08-20',
        categoryId: catMoradia,
        accountId: bb?.id,
        paymentMethod: 'bank_slip',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-08-20T10:00:00',
      },

      // July 2026
      {
        id: `tx_hist_jul1_${userId}`,
        userId,
        type: 'income',
        description: 'Comercial TV Construtora',
        amount: 7200,
        date: '2026-07-18',
        categoryId: catProjetos,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-07-18T10:00:00',
      },
      {
        id: `tx_hist_jul2_${userId}`,
        userId,
        type: 'expense',
        description: 'Lente Tamron 28-75mm + Custos',
        amount: 4600,
        date: '2026-07-22',
        categoryId: catEquip,
        accountId: nubank?.id,
        paymentMethod: 'credit_card',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-07-22T10:00:00',
      },

      // June 2026
      {
        id: `tx_hist_jun1_${userId}`,
        userId,
        type: 'income',
        description: 'Edição de Videoclipes Banda Rock',
        amount: 5400,
        date: '2026-06-14',
        categoryId: catProjetos,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-06-14T10:00:00',
      },
      {
        id: `tx_hist_jun2_${userId}`,
        userId,
        type: 'expense',
        description: 'Despesas Fixas e Manutenção Junho',
        amount: 3400,
        date: '2026-06-25',
        categoryId: catMoradia,
        accountId: bb?.id,
        paymentMethod: 'bank_slip',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-06-25T10:00:00',
      },

      // May 2026
      {
        id: `tx_hist_may1_${userId}`,
        userId,
        type: 'income',
        description: 'Feira Agropecuária Transmissão Ao Vivo',
        amount: 8100,
        date: '2026-05-19',
        categoryId: catProjetos,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-05-19T10:00:00',
      },
      {
        id: `tx_hist_may2_${userId}`,
        userId,
        type: 'expense',
        description: 'Despesas e Operação Maio',
        amount: 4200,
        date: '2026-05-28',
        categoryId: catMoradia,
        accountId: bb?.id,
        paymentMethod: 'bank_slip',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-05-28T10:00:00',
      },

      // April 2026
      {
        id: `tx_hist_apr1_${userId}`,
        userId,
        type: 'income',
        description: 'Campanha Publicitária Moda Inverno',
        amount: 6000,
        date: '2026-04-12',
        categoryId: catProjetos,
        accountId: nubank?.id,
        paymentMethod: 'pix',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-04-12T10:00:00',
      },
      {
        id: `tx_hist_apr2_${userId}`,
        userId,
        type: 'expense',
        description: 'Despesas e Software Abril',
        amount: 3100,
        date: '2026-04-20',
        categoryId: catMoradia,
        accountId: bb?.id,
        paymentMethod: 'bank_slip',
        status: 'completed',
        isDemo: true,
        createdAt: '2026-04-20T10:00:00',
      },
    ];

    this.saveTransactionsBulk(demoTransactions.map(t => ({ ...t, createdAt: new Date().toISOString() })));

    // Initial notifications
    this.saveNotification({
      id: `notif_1_${userId}`,
      userId,
      title: 'Conta a vencer amanhã',
      message: 'Internet Fibra 1GB (R$ 160,00) vence no dia 25/09/2026.',
      type: 'warning',
      date: '2026-09-24',
      read: false,
      linkTab: 'payables',
    });

    this.saveNotification({
      id: `notif_2_${userId}`,
      userId,
      title: 'Recebimento previsto',
      message: 'Você tem R$ 1.500,00 da Prefeitura previsto para 28/09/2026.',
      type: 'info',
      date: '2026-09-24',
      read: false,
      linkTab: 'receivables',
    });

    this.saveNotification({
      id: `notif_3_${userId}`,
      userId,
      title: 'Meta em progresso',
      message: 'Meta Sony FX30 atingiu 54% do valor objetivo!',
      type: 'success',
      date: '2026-09-22',
      read: true,
      linkTab: 'goals',
    });
  },

  purgeDemoData(userId: string): void {
    // Purge transactions
    const txs = this.getTransactions();
    const demoTxs = txs.filter((t) => matchesUser(t.userId, userId) && t.isDemo);
    setStored(
      STORAGE_KEYS.TRANSACTIONS,
      txs.filter((t) => !(matchesUser(t.userId, userId) && t.isDemo))
    );
    if (demoTxs.length > 0) {
      firestoreBulkDeleteDocs(SYNC_COLLECTIONS.TRANSACTIONS, demoTxs.map((t) => t.id)).catch(console.warn);
    }

    // Purge goals
    const goals = this.getGoals();
    const demoGoals = goals.filter((g) => matchesUser(g.userId, userId) && g.isDemo);
    setStored(
      STORAGE_KEYS.GOALS,
      goals.filter((g) => !(matchesUser(g.userId, userId) && g.isDemo))
    );
    if (demoGoals.length > 0) {
      firestoreBulkDeleteDocs(SYNC_COLLECTIONS.GOALS, demoGoals.map((g) => g.id)).catch(console.warn);
    }

    // Purge recurring
    const recs = this.getRecurring();
    const demoRecs = recs.filter((r) => matchesUser(r.userId, userId) && r.isDemo);
    setStored(
      STORAGE_KEYS.RECURRING,
      recs.filter((r) => !(matchesUser(r.userId, userId) && r.isDemo))
    );
    if (demoRecs.length > 0) {
      firestoreBulkDeleteDocs(SYNC_COLLECTIONS.RECURRING, demoRecs.map((r) => r.id)).catch(console.warn);
    }

    // Purge projects
    const projs = this.getProjects();
    const demoProjs = projs.filter((p) => matchesUser(p.userId, userId) && p.isDemo);
    setStored(
      STORAGE_KEYS.PROJECTS,
      projs.filter((p) => !(matchesUser(p.userId, userId) && p.isDemo))
    );
    if (demoProjs.length > 0) {
      firestoreBulkDeleteDocs(SYNC_COLLECTIONS.PROJECTS, demoProjs.map((p) => p.id)).catch(console.warn);
    }

    // Purge clients
    const clients = this.getClients();
    const demoClients = clients.filter((c) => matchesUser(c.userId, userId) && c.isDemo);
    setStored(
      STORAGE_KEYS.CLIENTS,
      clients.filter((c) => !(matchesUser(c.userId, userId) && c.isDemo))
    );
    if (demoClients.length > 0) {
      firestoreBulkDeleteDocs(SYNC_COLLECTIONS.CLIENTS, demoClients.map((c) => c.id)).catch(console.warn);
    }

    // Clear notifications
    const notifs = this.getNotifications();
    setStored(
      STORAGE_KEYS.NOTIFICATIONS,
      notifs.filter((n) => !(matchesUser(n.userId, userId) && n.id.startsWith('notif_')))
    );
  },

  /** Merge a validated backup into the authenticated owner's cloud data, never restore sessions. */
  async restoreBackup(backup: unknown): Promise<void> {
    const user = this.getCurrentUser();
    if (!user || !auth.currentUser?.emailVerified || getCanonicalUserId(auth.currentUser.email) !== user.id) throw new Error('Entre na sua conta antes de restaurar o backup.');
    if (!backup || typeof backup !== 'object' || Array.isArray(backup)) throw new Error('Arquivo de backup inválido.');
    const mapping = [
      [STORAGE_KEYS.ACCOUNTS, SYNC_COLLECTIONS.ACCOUNTS],
      [STORAGE_KEYS.CATEGORIES, SYNC_COLLECTIONS.CATEGORIES],
      [STORAGE_KEYS.CREDIT_CARDS, SYNC_COLLECTIONS.CREDIT_CARDS],
      [STORAGE_KEYS.CLIENTS, SYNC_COLLECTIONS.CLIENTS],
      [STORAGE_KEYS.PROJECTS, SYNC_COLLECTIONS.PROJECTS],
      [STORAGE_KEYS.TRANSACTIONS, SYNC_COLLECTIONS.TRANSACTIONS],
      [STORAGE_KEYS.RECURRING, SYNC_COLLECTIONS.RECURRING],
      [STORAGE_KEYS.GOALS, SYNC_COLLECTIONS.GOALS],
    ];
    const prepared: Array<{ key: string; collection: string; rows: Array<{ id: string; userId: string; [key: string]: any }> }> = [];
    for (const [key, collection] of mapping) {
      const raw = (backup as Record<string, unknown>)[key];
      if (raw === undefined) continue;
      const rows = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(rows)) throw new Error('Coleção inválida no backup.');
      if (rows.some(row => !row || typeof row.id !== 'string' || !row.id || row.id.includes('/') || row.userId !== user.id)) throw new Error('O backup contém dados inválidos ou de outra conta.');
      prepared.push({ key, collection, rows });
    }
    if (!prepared.length) throw new Error('O arquivo não contém dados financeiros reconhecidos.');
    const imported = (collection: string) => prepared.find(item => item.collection === collection)?.rows || [];
    const accounts = [...this.getAccounts(user.id), ...imported(SYNC_COLLECTIONS.ACCOUNTS)] as Account[];
    for (const account of imported(SYNC_COLLECTIONS.ACCOUNTS)) {
      toCents(account.initialBalance);
      if (typeof account.name !== 'string' || !account.name.trim()) throw new Error('Conta inválida no backup.');
    }
    for (const tx of imported(SYNC_COLLECTIONS.TRANSACTIONS)) validateTransaction(tx as Transaction, accounts);
    for (const project of imported(SYNC_COLLECTIONS.PROJECTS)) {
      if (toCents(project.totalValue) < 0 || toCents(project.receivedValue) < 0 || toCents(project.receivedValue) > toCents(project.totalValue)) throw new Error('Valores de projeto inválidos no backup.');
      if (!isValidDate(project.projectDate) || !isValidDate(project.paymentDeadline)) throw new Error('Datas de projeto inválidas no backup.');
      project.pendingValue = fromCents(toCents(project.totalValue) - toCents(project.receivedValue));
    }
    for (const item of imported(SYNC_COLLECTIONS.RECURRING)) {
      if (toCents(item.amount) <= 0 || !isValidDate(item.startDate) || !['monthly','weekly','yearly'].includes(item.periodicity)) throw new Error('Recorrência inválida no backup.');
    }
    // All validation above happens before writing any local or remote collection.
    financialResetUsers.add(user.id);
    try {
      for (const { key, collection, rows } of prepared) {
        const records = rows.map(row => ['transactions','recurring'].includes(collection) ? { ...row, createdAt: new Date().toISOString() } : row);
        await firestoreBulkSaveDocs(collection, records);
        const cloud = await firestoreFetchAll<{ id: string; userId: string }>(collection, user.id);
        const others = getStored<Array<{ userId?: string }>>(key, []).filter(row => !matchesUser(row.userId, user.id));
        setStoredSilently(key, [...others, ...cloud]);
      }
      notifyStoreUpdate();
    } finally { financialResetUsers.delete(user.id); }
  },

  // Reset the financial ledger, preserving unrelated registrations and goal savings.
  async resetAll(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user || !auth.currentUser?.emailVerified || getCanonicalUserId(auth.currentUser.email) !== user.id) {
      throw new Error('Entre na sua conta e conecte à internet para zerar os lançamentos.');
    }
    const userId = user.id;
    financialResetUsers.add(userId);
    try {
      // Fetch authoritative data; a failed read must never be mistaken for an empty collection.
      const [transactions, recurring, accounts, projects, notifications] = await Promise.all([
        firestoreFetchAll<Transaction>(SYNC_COLLECTIONS.TRANSACTIONS, userId),
        firestoreFetchAll<RecurringTransaction>(SYNC_COLLECTIONS.RECURRING, userId),
        firestoreFetchAll<Account>(SYNC_COLLECTIONS.ACCOUNTS, userId),
        firestoreFetchAll<Project>(SYNC_COLLECTIONS.PROJECTS, userId),
        firestoreFetchAll<InAppNotification>(SYNC_COLLECTIONS.NOTIFICATIONS, userId),
      ]);
      const merge = <T extends { id: string }>(local: T[], remote: T[]): T[] => [...new Map([...local, ...remote].map(x => [x.id, x])).values()];
      const txs = merge(this.getTransactions(userId), transactions);
      const recs = merge(this.getRecurring(userId), recurring);
      const accts = merge(this.getAccounts(userId), accounts).map(a => ({ ...a, initialBalance: 0 }));
      // Remove receipt history without changing the contract value or independent goal savings.
      const projs = merge(this.getProjects(userId), projects).map(p => ({ ...p, receivedValue: 0, pendingValue: p.totalValue, status: p.status === 'paid' ? 'waiting_payment' as const : p.status }));
      const notifs = merge(this.getNotifications(userId), notifications);
      // Clear the generators first, so forecasts cannot be regenerated after the reset.
      await firestoreBulkDeleteDocs(SYNC_COLLECTIONS.RECURRING, recs.map(r => r.id));
      await firestoreBulkDeleteDocs(SYNC_COLLECTIONS.TRANSACTIONS, txs.map(t => t.id));
      await firestoreBulkDeleteDocs(SYNC_COLLECTIONS.NOTIFICATIONS, notifs.map(n => n.id));
      await firestoreBulkSaveDocs(SYNC_COLLECTIONS.ACCOUNTS, accts);
      await firestoreBulkSaveDocs(SYNC_COLLECTIONS.PROJECTS, projs);
      // This marker disables migration of stale local financial data after a cloud reset.
      await setDoc(doc(db, SYNC_COLLECTIONS.USERS, userId), { financialResetAt: new Date().toISOString() }, { merge: true });
      const replaceUserRows = (key: string, rows: unknown[]) => setStoredSilently(key, [
        ...getStored<Array<{ userId?: string }>>(key, []).filter(row => !matchesUser(row.userId, userId)), ...rows,
      ]);
      replaceUserRows(STORAGE_KEYS.TRANSACTIONS, []);
      replaceUserRows(STORAGE_KEYS.RECURRING, []);
      replaceUserRows(STORAGE_KEYS.NOTIFICATIONS, []);
      replaceUserRows(STORAGE_KEYS.ACCOUNTS, accts);
      replaceUserRows(STORAGE_KEYS.PROJECTS, projs);
      notifyStoreUpdate();
    } finally {
      financialResetUsers.delete(userId);
    }
  },
};

const financialResetUsers = new Set<string>();
let activeSyncUser: string | null = null;

/**
 * Start real-time sync only after Firebase Auth and ownership profile are ready.
 * Initial migration only uploads existing local data to an empty cloud collection.
 * Cloud records then become authoritative. Never erase local data after a failed fetch.
 */
export function initRealtimeSync(userId: string): () => void {
  if (activeSyncUser === userId) return () => {};
  activeSyncUser = userId;
  let cancelled = false;
  const unsubscribers: Array<() => void> = [];
  const mapping: Array<{ name: string; key: string }> = [
    { name: SYNC_COLLECTIONS.ACCOUNTS, key: STORAGE_KEYS.ACCOUNTS },
    { name: SYNC_COLLECTIONS.CATEGORIES, key: STORAGE_KEYS.CATEGORIES },
    { name: SYNC_COLLECTIONS.CREDIT_CARDS, key: STORAGE_KEYS.CREDIT_CARDS },
    { name: SYNC_COLLECTIONS.CLIENTS, key: STORAGE_KEYS.CLIENTS },
    { name: SYNC_COLLECTIONS.PROJECTS, key: STORAGE_KEYS.PROJECTS },
    { name: SYNC_COLLECTIONS.TRANSACTIONS, key: STORAGE_KEYS.TRANSACTIONS },
    { name: SYNC_COLLECTIONS.RECURRING, key: STORAGE_KEYS.RECURRING },
    { name: SYNC_COLLECTIONS.GOALS, key: STORAGE_KEYS.GOALS },
    { name: SYNC_COLLECTIONS.NOTIFICATIONS, key: STORAGE_KEYS.NOTIFICATIONS },
    { name: SYNC_COLLECTIONS.SETTINGS, key: STORAGE_KEYS.REMINDER_SETTINGS },
  ];
  async function begin() {
    const profile = await getDoc(doc(db, SYNC_COLLECTIONS.USERS, userId));
    const hadFinancialReset = profile.exists() && !!profile.data().financialResetAt;
    for (const { name, key } of mapping) {
      if (cancelled || financialResetUsers.has(userId)) return;
      try {
        const remote = await firestoreFetchAll<{ id: string; userId: string }>(name, userId);
        if (cancelled || financialResetUsers.has(userId)) return;
        const oldValue = getStored<unknown>(key, name === SYNC_COLLECTIONS.SETTINGS ? null : []);
        const local = name === SYNC_COLLECTIONS.SETTINGS
          ? (oldValue && typeof oldValue === 'object' ? [{ ...(oldValue as object), id: `settings_${auth.currentUser?.uid}`, userId }] : [])
          : (Array.isArray(oldValue) ? oldValue.filter(item => item?.userId === userId) : []);
        // A one-time migration is safe only into a verified empty cloud collection.
        if (!remote.length && local.length && !hadFinancialReset) {
          await firestoreBulkSaveDocs(name, local as Array<{id:string}>);
        }
        if (cancelled || financialResetUsers.has(userId)) return;
        const updated = await firestoreFetchAll<{ id: string; userId: string }>(name, userId);
        if (cancelled || financialResetUsers.has(userId)) return;
        if (name === SYNC_COLLECTIONS.SETTINGS) {
          if (updated[0]) setStoredSilently(key, updated[0]);
        } else {
          setStoredSilently(key, updated);
        }
        notifyStoreUpdate();
        unsubscribers.push(firestoreSubscribeCollection(name, (items) => {
          if (cancelled || financialResetUsers.has(userId)) return;
          if (name === SYNC_COLLECTIONS.SETTINGS) {
            if (items[0]) setStoredSilently(key, items[0]);
          } else {
            setStoredSilently(key, items);
          }
          notifyStoreUpdate();
        }, userId));
      } catch (error) {
        console.error(`Cloud sync failed for ${name}; local data retained.`, error);
      }
    }
  }
  void begin().catch(error => console.error('Não foi possível iniciar a sincronização:', error));
  return () => {
    cancelled = true;
    unsubscribers.forEach(fn => fn());
    if (activeSyncUser === userId) activeSyncUser = null;
  };
}

/** Establish ownership profile for Firestore rules, after verified Firebase Auth. */
export async function ensureCloudProfile(user: User): Promise<void> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser || !firebaseUser.emailVerified || !firebaseUser.email) {
    throw new Error('Confirme seu e-mail para ativar a sincronização.');
  }
  if (firebaseUser.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error('O usuário autenticado não corresponde ao perfil local.');
  }
  const ref = doc(db, SYNC_COLLECTIONS.USERS, user.id);
  const prior = await getDoc(ref);
  if (!prior.exists()) {
    await setDoc(ref, { ...user, firebaseUid: firebaseUser.uid });
  } else if (prior.data().firebaseUid !== firebaseUser.uid) {
    throw new Error('Este perfil já pertence a outra conta Firebase.');
  }
}
