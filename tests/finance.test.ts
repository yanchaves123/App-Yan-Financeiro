import test from 'node:test';
import assert from 'node:assert/strict';
import { splitInstallments, addMonths, occurrenceDates, reconcileProjects, buildInvoiceSettlement, validateTransaction, toCents } from '../src/lib/finance';
import { calculateAccountBalance, calculateTotalAvailableBalance, getMonthFinancialSummary, calculateCreditCardInvoice } from '../src/lib/calculations';
import { getCurrentMonthYear, getTodayDateString } from '../src/lib/formatters';
import type { Account, Transaction, Project, RecurringTransaction, CreditCard } from '../src/types';
const account = (id: string, initialBalance = 0): Account => ({ id, initialBalance, userId: 'u', name: id, type: 'digital', institution: 'Teste', color: '', createdAt: '' });
const tx = (extra: Partial<Transaction> = {}): Transaction => ({ id: 'tx', userId: 'u', type: 'expense', amount: 100, description: 'Teste', date: '2026-10-14', categoryId: 'cat', paymentMethod: 'pix', status: 'completed', accountId: 'a', createdAt: '', ...extra });
const project: Project = { id: 'p', userId: 'u', clientId: 'c', name: 'Projeto', totalValue: 1000, receivedValue: 0, pendingValue: 1000, projectDate: '2026-10-14', paymentDeadline: '2026-10-30', status: 'in_progress', createdAt: '' };
const recurrence: RecurringTransaction = { id: 'r', userId: 'u', type: 'expense', description: 'Teste', amount: 89.9, periodicity: 'monthly', dueDay: 31, categoryId: 'cat', accountId: 'a', startDate: '2026-10-14', active: true, createdAt: '' };
const card: CreditCard = { id: 'card', userId: 'u', name: 'Cartão', institution: 'Teste', color: '', limit: 1000, closingDay: 5, dueDay: 12, createdAt: '' };

test('R$100 in 3 installments preserves every cent', () => assert.deepEqual(splitInstallments(100, 3), [33.33, 33.33, 33.34]));
test('installments preserve total across 1–24 payments and many amounts', () => {
  for (let cents = 24; cents < 10000; cents += 37) for (let count = 1; count <= 24; count++) {
    const amounts = splitInstallments(cents / 100, count);
    assert.equal(amounts.reduce((sum, amount) => sum + toCents(amount), 0), cents);
    assert.ok(amounts.every(amount => amount > 0));
  }
});
test('rejects invalid money and zero-cent installments', () => { for (const value of [NaN, Infinity, -1, 0]) assert.throws(() => splitInstallments(value, 3)); assert.throws(() => splitInstallments(.01, 3)); });
test('month-end installments clamp to valid dates and recover the original day', () => {
  assert.equal(addMonths('2027-01-31', 1), '2027-02-28'); assert.equal(addMonths('2028-01-31', 1), '2028-02-29'); assert.equal(addMonths('2027-01-31', 2), '2027-03-31');
});
test('current date and month use the local clock rather than the demo date', () => {
  const now = new Date(), today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  assert.equal(getTodayDateString(), today); assert.equal(getCurrentMonthYear(), today.slice(0,7));
});
test('transfer debits source, credits destination and preserves total and DRE', () => {
  const accounts = [account('a',1000),account('b')]; const transfer = tx({ type:'transfer', destinationAccountId:'b', paymentMethod:'transfer' });
  assert.equal(calculateAccountBalance(accounts[0],[transfer]),900); assert.equal(calculateAccountBalance(accounts[1],[transfer]),100);
  assert.equal(calculateTotalAvailableBalance(accounts,[transfer]),1000); assert.equal(getMonthFinancialSummary([transfer],'2026-10').netResult,0);
});
test('invalid and missing transfer accounts are rejected', () => { for (const patch of [{accountId:''},{destinationAccountId:''},{destinationAccountId:'a'}]) assert.throws(() => validateTransaction(tx({type:'transfer',destinationAccountId:'b',...patch}),[account('a'),account('b')])); });
test('pending items do not change cash and become overdue based on actual date argument', () => {
  const pending = tx({status:'pending',date:'2026-10-13'}); assert.equal(calculateAccountBalance(account('a',1000),[pending]),1000);
  const summary=getMonthFinancialSummary([pending],'2026-10','2026-10-14'); assert.equal(summary.overduePayables,100); assert.equal(summary.totalExpense,0);
});
test('monthly recurrence respects start/end dates and short months', () => {
  assert.deepEqual(occurrenceDates({...recurrence,endDate:'2027-02-28'},'2026-10-14',6),['2026-10-31','2026-11-30','2026-12-31','2027-01-31','2027-02-28']);
  assert.deepEqual(occurrenceDates({...recurrence,active:false},'2026-10-14',6),[]);
});
test('weekly and annual recurrence honor their actual intervals', () => {
  assert.deepEqual(occurrenceDates({...recurrence,periodicity:'weekly',startDate:'2026-10-14'},'2026-10-14',0),['2026-10-14','2026-10-21','2026-10-28']);
  assert.deepEqual(occurrenceDates({...recurrence,periodicity:'yearly',startDate:'2024-02-29',dueDay:29},'2026-01-14',14),['2026-02-28','2027-02-28']);
});
test('project initial receipt + remaining receipt reconcile to full cash and project total', () => {
  const initial=tx({id:'initial',type:'income',projectId:'p',amount:200}); const final=tx({id:'final',type:'income',projectId:'p',amount:800});
  const [partial]=reconcileProjects([project],[],[initial]); assert.equal(partial.receivedValue,200); assert.equal(partial.pendingValue,800);
  const [paid]=reconcileProjects([partial],[initial],[initial,final]); assert.equal(paid.receivedValue,1000); assert.equal(paid.pendingValue,0); assert.equal(paid.status,'paid'); assert.equal(calculateAccountBalance(account('a'),[initial,final]),1000);
  assert.equal(reconcileProjects([paid],[initial,final],[initial])[0].receivedValue,200);
});
test('project edits/status toggles preserve legacy opening amounts and reject excess receipts', () => {
  const legacy={...project,receivedValue:200,pendingValue:800}; const receipt=tx({type:'income',projectId:'p',amount:800});
  assert.equal(reconcileProjects([legacy],[],[receipt])[0].receivedValue,1000); assert.throws(()=>reconcileProjects([legacy],[],[{...receipt,amount:801}]));
});
test('invoice payment frees limit, debits cash once and does not double expenses', () => {
  const purchase=tx({paymentMethod:'credit_card',creditCardId:'card',accountId:undefined});
  assert.equal(calculateAccountBalance(account('a',1000),[purchase]),1000);
  const settlement=buildInvoiceSettlement(card,[purchase],'2026-10','u','a','2026-10-14');
  assert.equal(calculateCreditCardInvoice(card,[purchase],'2026-10').currentInvoice,100);
  assert.equal(calculateCreditCardInvoice(card,settlement,'2026-10').currentInvoice,0); assert.equal(calculateCreditCardInvoice(card,settlement,'2026-10').availableLimit,1000);
  assert.equal(calculateAccountBalance(account('a',1000),settlement),900); assert.equal(getMonthFinancialSummary(settlement,'2026-10').totalExpense,100);
  assert.deepEqual(buildInvoiceSettlement(card,settlement,'2026-10','u','a','2026-10-14'),[]);
});
