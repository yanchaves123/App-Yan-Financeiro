import type { Account, CreditCard, Project, RecurringTransaction, Transaction } from '../types';
export function toCents(value: number): number {
  const cents = Math.round((value + Number.EPSILON) * 100);
  if (!Number.isFinite(value) || !Number.isSafeInteger(cents)) throw new Error('Valor monetário inválido.');
  return cents;
}
export const fromCents = (value: number): number => value / 100;
export function splitInstallments(total: number, count: number): number[] {
  const cents = toCents(total);
  if (!Number.isInteger(count) || count < 1 || count > 360 || cents < count) throw new Error('Cada parcela deve ter pelo menos R$ 0,01.');
  const base = Math.floor(cents / count), remainder = cents % count;
  return Array.from({ length: count }, (_, i) => fromCents(base + (i >= count - remainder ? 1 : 0)));
}
export function dateInMonth(yearMonth: string, day: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${yearMonth}-${String(Math.min(last, Math.max(1, day))).padStart(2, '0')}`;
}
export function addMonths(date: string, count: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + count, 1));
  return dateInMonth(`${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, '0')}`, day);
}
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
/** Owner's rule: every new card expense belongs to the following calendar month. */
export function scheduleCardPurchase(tx: Transaction, card?: CreditCard, previous?: Transaction): Transaction {
  if (tx.paymentMethod !== 'credit_card' || tx.type !== 'expense') return tx;
  // Existing ledger dates are authoritative: editing a description must not shift a month again.
  if (previous?.paymentMethod === 'credit_card' && !tx.purchaseDate) return tx;
  if (!card || card.userId !== tx.userId) throw new Error('Selecione um cartão válido.');
  const purchaseDate = tx.purchaseDate || tx.date;
  if (!isValidDate(purchaseDate)) throw new Error('Data da compra inválida.');
  if (previous && previous.purchaseDate === tx.purchaseDate && previous.creditCardId === tx.creditCardId && previous.date === tx.date) return tx;
  return { ...tx, purchaseDate, date: dateInMonth(addMonths(purchaseDate, 1).slice(0, 7), card.dueDay), status: tx.status === 'overdue' ? 'pending' : tx.status, accountId: undefined };
}
export function validateTransaction(tx: Transaction, accounts: Account[]): void {
  if (tx.isProjectForecast) throw new Error('Previsões de projetos devem ser recebidas pelo formulário do projeto.');
  if (!['income','expense','transfer'].includes(tx.type) || !['completed','pending','overdue'].includes(tx.status)
    || !['pix','credit_card','debit_card','bank_slip','cash','transfer'].includes(tx.paymentMethod)
    || typeof tx.description !== 'string' || !tx.description.trim()) throw new Error('Lançamento com tipo, descrição ou status inválido.');
  if (tx.paymentMethod === 'credit_card' && !tx.creditCardId) throw new Error('Selecione o cartão utilizado.');
  if (toCents(tx.amount) <= 0 || !isValidDate(tx.date)) throw new Error('Informe valor e data válidos.');
  if (tx.paymentMethod !== 'credit_card' && tx.type !== 'transfer' && !accounts.some(a => a.id === tx.accountId && a.userId === tx.userId)) throw new Error('Selecione uma conta válida para o lançamento.');
  if (tx.type === 'transfer' && (!accounts.some(a => a.id === tx.accountId) || !accounts.some(a => a.id === tx.destinationAccountId) || tx.accountId === tx.destinationAccountId)) throw new Error('Selecione contas diferentes e válidas para a transferência.');
}
export function occurrenceDates(item: RecurringTransaction, today: string, monthsAhead: number): string[] {
  if (!item.active || !isValidDate(item.startDate) || !isValidDate(today)) return [];
  const first = `${today.slice(0, 7)}-01`, last = dateInMonth(addMonths(first, monthsAhead).slice(0, 7), 31);
  const dates: string[] = [];
  if (item.periodicity === 'weekly') {
    const startMs = Date.parse(`${item.startDate}T12:00:00Z`), week = 7 * 86400000;
    let ms = startMs + Math.max(0, Math.ceil((Date.parse(`${first}T12:00:00Z`) - startMs) / week)) * week;
    for (; ms <= Date.parse(`${last}T12:00:00Z`); ms += week) dates.push(new Date(ms).toISOString().slice(0, 10));
  } else {
    for (let offset = 0; offset <= monthsAhead; offset++) {
      const month = addMonths(first, offset).slice(0, 7);
      if (item.periodicity === 'yearly' && month.slice(5) !== item.startDate.slice(5, 7)) continue;
      dates.push(dateInMonth(month, item.dueDay || Number(item.startDate.slice(8))));
    }
  }
  return dates.filter(date => date >= item.startDate && (!item.endDate || date <= item.endDate));
}
export function sameOccurrence(item: RecurringTransaction, date: string, other: string): boolean {
  return item.periodicity === 'monthly' ? date.slice(0, 7) === other.slice(0, 7) : date === other;
}
/** Preserve legacy opening receipts; apply only the change in linked cash movements. */
export function reconcileProjects(projects: Project[], before: Transaction[], after: Transaction[]): Project[] {
  const sum = (txs: Transaction[], id: string) => txs.filter(t => t.projectId === id && t.type === 'income' && t.status === 'completed').reduce((total, t) => total + toCents(t.amount), 0);
  return projects.map(project => {
    const delta = sum(after, project.id) - sum(before, project.id);
    if (!delta) return project;
    const received = toCents(project.receivedValue) + delta;
    if (received < 0 || received > toCents(project.totalValue)) throw new Error('O recebimento deve respeitar o saldo pendente do projeto.');
    const pending = toCents(project.totalValue) - received;
    return { ...project, receivedValue: fromCents(received), pendingValue: fromCents(pending), status: project.status === 'cancelled' ? 'cancelled' : pending === 0 ? 'paid' : project.status === 'paid' ? 'waiting_payment' : project.status };
  });
}
/** Purchases remain the expense in the DRE; the settlement debits cash once. */
export function buildInvoiceSettlement(card: CreditCard, txs: Transaction[], month: string, userId: string, accountId: string, today: string): Transaction[] {
  if (!accountId) throw new Error('Selecione a conta de pagamento do cartão.');
  const purchases = txs.filter(t => t.userId === userId && t.type === 'expense' && t.creditCardId === card.id && t.date.startsWith(month) && !t.invoicePaid);
  const cents = purchases.reduce((sum, t) => sum + toCents(t.amount), 0);
  if (cents <= 0) return [];
  const paymentId = `tx_card_pay_${card.id}_${month}_${crypto.randomUUID()}`;
  return [...purchases.map(t => ({ ...t, status: 'completed' as const, invoicePaid: true, invoicePaymentId: paymentId })),
    { id: paymentId, userId, type: 'expense', description: `Pagamento Fatura ${card.name} (${month})`, amount: fromCents(cents), date: today, categoryId: 'cat_card_payment', accountId, paymentMethod: 'bank_slip', status: 'completed', isCardInvoicePayment: true, createdAt: new Date().toISOString() }];
}
