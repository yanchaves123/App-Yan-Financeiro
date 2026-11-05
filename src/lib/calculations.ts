import { Account, CreditCard, Transaction } from '../types';
import { getMonthName, getTodayDateString, getCurrentMonthYear } from './formatters';
import { toCents, fromCents } from './finance';

export interface MonthFinancialSummary {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  savingsRate: number; // percentage
  pendingReceivables: number;
  pendingPayables: number;
  overduePayables: number;
  overdueReceivables: number;
  completedIncomeCount: number;
  completedExpenseCount: number;
}

export interface CategorySummary {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  type: string;
  total: number;
  percentage: number;
}

export interface MonthEvolutionPoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export function calculateAccountBalance(account: Account, transactions: Transaction[]): number {
  let balance = account.initialBalance || 0;

  for (const t of transactions) {
    if (t.status !== 'completed' || t.paymentMethod === 'credit_card') continue;

    // Normal Income to this account
    if (t.type === 'income' && t.accountId === account.id) {
      balance += t.amount;
    }
    // Normal Expense from this account
    else if (t.type === 'expense' && t.accountId === account.id) {
      balance -= t.amount;
    }
    // Transfer from this account (outflow)
    else if (t.type === 'transfer' && t.accountId === account.id) {
      balance -= t.amount;
    }
    // Transfer into this account (inflow)
    else if (t.type === 'transfer' && t.destinationAccountId === account.id) {
      balance += t.amount;
    }
  }

  return fromCents(toCents(balance));
}

export function calculateTotalAvailableBalance(accounts: Account[], transactions: Transaction[]): number {
  return accounts.reduce((acc, account) => acc + calculateAccountBalance(account, transactions), 0);
}

export function getMonthFinancialSummary(
  transactions: Transaction[],
  yearMonth: string, // YYYY-MM
  todayStr: string = getTodayDateString()
): MonthFinancialSummary {
  const monthTransactions = transactions.filter((t) => t.date.startsWith(yearMonth));

  let totalIncome = 0;
  let totalExpense = 0;
  let pendingReceivables = 0;
  let pendingPayables = 0;
  let overduePayables = 0;
  let overdueReceivables = 0;
  let completedIncomeCount = 0;
  let completedExpenseCount = 0;

  for (const t of monthTransactions) {
    if (t.type === 'income') {
      if (t.status === 'completed') {
        totalIncome += t.amount;
        completedIncomeCount++;
      } else {
        // Pending or overdue income
        const isPastDue = t.date < todayStr;
        if (isPastDue || t.status === 'overdue') {
          overdueReceivables += t.amount;
        } else {
          pendingReceivables += t.amount;
        }
      }
    } else if ((t.type === 'expense' && !t.isCardInvoicePayment)) {
      if (t.status === 'completed') {
        totalExpense += t.amount;
        completedExpenseCount++;
      } else {
        // Pending or overdue expense
        const isPastDue = t.date < todayStr;
        if (isPastDue || t.status === 'overdue') {
          overduePayables += t.amount;
        } else {
          pendingPayables += t.amount;
        }
      }
    }
  }

  const netResult = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netResult / totalIncome) * 100) : 0;

  return {
    yearMonth,
    totalIncome,
    totalExpense,
    netResult,
    savingsRate,
    pendingReceivables,
    pendingPayables,
    overduePayables,
    overdueReceivables,
    completedIncomeCount,
    completedExpenseCount,
  };
}

export function getExpensesByCategory(
  transactions: Transaction[],
  categoriesMap: Map<string, { name: string; color: string; icon: string; type: string }>,
  yearMonth?: string
): CategorySummary[] {
  const relevant = transactions.filter((t) => {
    if (t.type !== 'expense' || t.isCardInvoicePayment || t.status !== 'completed') return false;
    if (yearMonth && !t.date.startsWith(yearMonth)) return false;
    return true;
  });

  const totalsByCat = new Map<string, number>();
  let grandTotal = 0;

  for (const t of relevant) {
    const catId = t.categoryId || 'unknown';
    const current = totalsByCat.get(catId) || 0;
    totalsByCat.set(catId, current + t.amount);
    grandTotal += t.amount;
  }

  const result: CategorySummary[] = [];

  totalsByCat.forEach((total, categoryId) => {
    const cat = categoriesMap.get(categoryId) || {
      name: 'Sem Categoria',
      color: '#94a3b8',
      icon: 'CircleHelp',
      type: 'expense_personal',
    };

    result.push({
      categoryId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      type: cat.type,
      total,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
    });
  });

  return result.sort((a, b) => b.total - a.total);
}

export function getSixMonthEvolution(
  transactions: Transaction[],
  currentYearMonth: string = getCurrentMonthYear()
): MonthEvolutionPoint[] {
  const points: MonthEvolutionPoint[] = [];
  const [yearStr, monthStr] = currentYearMonth.split('-');
  const currYear = parseInt(yearStr, 10);
  const currMonth = parseInt(monthStr, 10); // 1-12

  for (let i = 5; i >= 0; i--) {
    let m = currMonth - i;
    let y = currYear;
    while (m <= 0) {
      m += 12;
      y -= 1;
    }

    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    const monthName = getMonthName(m - 1).slice(0, 3);
    const label = `${monthName}/${String(y).slice(2)}`;

    let inc = 0;
    let exp = 0;

    for (const t of transactions) {
      if (!t.date.startsWith(monthKey) || t.status !== 'completed') continue;
      if (t.type === 'income') inc += t.amount;
      if ((t.type === 'expense' && !t.isCardInvoicePayment)) exp += t.amount;
    }

    points.push({
      monthKey,
      label,
      income: inc,
      expense: exp,
      net: inc - exp,
    });
  }

  return points;
}

export function calculateCreditCardInvoice(
  card: CreditCard,
  transactions: Transaction[],
  yearMonth: string = getCurrentMonthYear()
): {
  currentInvoice: number;
  nextInvoice: number;
  totalUsedLimit: number;
  availableLimit: number;
} {
  // All transactions charged to this credit card that are expenses
  const cardTxs = transactions.filter((t) => t.creditCardId === card.id && (t.type === 'expense' && !t.isCardInvoicePayment));

  let currentInvoice = 0;
  let nextInvoice = 0;
  let totalUsedLimit = 0;

  const [yStr, mStr] = yearMonth.split('-');
  const currentY = parseInt(yStr, 10);
  const currentM = parseInt(mStr, 10);

  const nextM = currentM === 12 ? 1 : currentM + 1;
  const nextY = currentM === 12 ? currentY + 1 : currentY;
  const nextYearMonth = `${nextY}-${String(nextM).padStart(2, '0')}`;

  for (const t of cardTxs) {
    if (t.invoicePaid) continue;
    totalUsedLimit += t.amount;

    if (t.date.startsWith(yearMonth)) {
      currentInvoice += t.amount;
    } else if (t.date.startsWith(nextYearMonth)) {
      nextInvoice += t.amount;
    }
  }

  const availableLimit = Math.max(0, card.limit - totalUsedLimit);

  return {
    currentInvoice,
    nextInvoice,
    totalUsedLimit,
    availableLimit,
  };
}

export function calculateEmergencyReserve(
  transactions: Transaction[],
  totalAvailable: number,
  targetMonths: number = 6
): {
  monthlyBurnRate: number;
  targetReserveAmount: number;
  currentReserveAmount: number;
  completionRate: number;
  coverageMonths: number;
} {
  // Same six-month window as the dashboard; no invented expense for an empty account.
  const history = getSixMonthEvolution(transactions.filter(t => t.date <= getTodayDateString()));
  const avgExpense = history.reduce((total, month) => total + month.expense, 0) / 6;

  const targetReserve = avgExpense * targetMonths;
  const currentReserve = totalAvailable;
  const completionRate = targetReserve > 0 ? Math.min(100, (currentReserve / targetReserve) * 100) : 0;
  const coverageMonths = avgExpense > 0 ? currentReserve / avgExpense : 0;

  return {
    monthlyBurnRate: avgExpense,
    targetReserveAmount: targetReserve,
    currentReserveAmount: currentReserve,
    completionRate,
    coverageMonths,
  };
}
