/** Compare date/text fields safely without modifying financial records.
 * Legacy local data or incomplete Firestore documents may lack date/createdAt.
 */
export function safeCompare(a: unknown, b: unknown): number {
  const left = typeof a === 'string' ? a : '';
  const right = typeof b === 'string' ? b : '';
  return left.localeCompare(right);
}

export function safeStartsWith(value: unknown, prefix: string): boolean {
  return typeof value === 'string' && value.startsWith(prefix);
}
