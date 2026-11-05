export type TransactionType = 'income' | 'expense' | 'transfer';

export type PaymentMethod =
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'bank_slip'
  | 'cash'
  | 'transfer';

export type TransactionStatus = 'completed' | 'pending' | 'overdue';

export type CategoryType = 'income' | 'expense_personal' | 'expense_professional';

export type AccountType =
  | 'checking'
  | 'savings'
  | 'digital'
  | 'investment'
  | 'wallet'
  | 'cash';

export type ProjectStatus =
  | 'budget'
  | 'approved'
  | 'in_progress'
  | 'delivered'
  | 'waiting_payment'
  | 'paid'
  | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  profession?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  institution: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  institution: string;
  color: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  paymentAccountId?: string;
  createdAt: string;
}

export interface Client {
  isDemo?: boolean;
  id: string;
  userId: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  city?: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  isDemo?: boolean;
  id: string;
  userId: string;
  clientId: string;
  name: string;
  description?: string;
  totalValue: number;
  projectDate: string;
  paymentDeadline: string;
  status: ProjectStatus;
  paymentMethod?: PaymentMethod;
  receivedValue: number;
  pendingValue: number;
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  isProjectForecast?: boolean;
  id: string;
  userId: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  purchaseDate?: string; // Original purchase/recurrence date, before invoice scheduling
  categoryId: string;
  subCategory?: string;
  accountId?: string;
  destinationAccountId?: string; // For transfers
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  invoicePaid?: boolean;
  invoicePaymentId?: string;
  isCardInvoicePayment?: boolean;
  installmentCurrent?: number;
  installmentTotal?: number;
  parentPurchaseId?: string;
  clientId?: string;
  projectId?: string;
  observations?: string;
  status: TransactionStatus;
  isRecurring?: boolean;
  recurrenceId?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  periodicity: 'monthly' | 'weekly' | 'yearly';
  dueDay?: number; // e.g. day of month 1-31
  categoryId: string;
  accountId?: string;
  creditCardId?: string;
  paymentMethod?: PaymentMethod;
  clientId?: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  isDemo?: boolean;
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
  linkedAccountId?: string;
  notes?: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface EmergencyReserveConfig {
  userId: string;
  targetMonths: number;
  customMonthlyExpense?: number;
  customReserveAmount?: number;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  date: string;
  read: boolean;
  linkTab?: string;
}

export interface ReminderSettings {
  enabled: boolean;
  times: string[];
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  lastTriggered?: Record<string, string>;
}

