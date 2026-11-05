/** Protect optimistic edits/deletions from older realtime snapshots during a write. */
export class PendingSync {
  private entries = new Map<string, Map<string, { token: number; value: any | null }>>();
  private token = 0;
  begin(collection: string, id: string, value: any | null): number {
    const token = ++this.token;
    if (!this.entries.has(collection)) this.entries.set(collection, new Map());
    this.entries.get(collection)!.set(id, { token, value });
    return token;
  }
  finish(collection: string, id: string, token: number): void {
    if (this.entries.get(collection)?.get(id)?.token === token) this.entries.get(collection)!.delete(id);
  }
  overlay<T extends { id: string }>(collection: string, rows: T[]): T[] {
    const merged = new Map(rows.map(row => [row.id, row]));
    for (const [id, entry] of this.entries.get(collection) || []) {
      if (entry.value === null) merged.delete(id); else merged.set(id, entry.value);
    }
    return [...merged.values()];
  }
}
