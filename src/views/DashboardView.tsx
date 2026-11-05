import { getTodayDateString, getCurrentMonthYear } from '../lib/formatters';
import { safeCompare } from '../lib/safeCompare';
import React from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  Coins,
  CalendarClock,
  TrendingUp,
  CreditCard as CardIcon,
  Sparkles,
  ChevronRight,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Account, Category, Client, CreditCard, Project, Transaction } from '../types';
import {
  calculateTotalAvailableBalance,
  getMonthFinancialSummary,
  getExpensesByCategory,
  getSixMonthEvolution,
  calculateCreditCardInvoice,
} from '../lib/calculations';
import { formatCurrency, formatDate, formatMonthYear, formatShortDate } from '../lib/formatters';

interface DashboardViewProps {
  currentYearMonth: string;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
  clients: Client[];
  projects: Project[];
  onOpenNewTransaction: (type?: 'income' | 'expense') => void;
  onOpenNewTransfer: () => void;
  onOpenAIModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onNavigateTab: (tab: any) => void;
}

export function DashboardView({
  currentYearMonth,
  transactions,
  accounts,
  categories,
  creditCards,
  clients,
  projects,
  onOpenNewTransaction,
  onOpenNewTransfer,
  onOpenAIModal,
  onSelectTransaction,
  onNavigateTab,
}: DashboardViewProps) {
  const summary = getMonthFinancialSummary(transactions, currentYearMonth);
  const totalAvailable = calculateTotalAvailableBalance(accounts, transactions);

  // Category mapping
  const catMap = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color, icon: c.icon, type: c.type }]));
  const expensesByCat = getExpensesByCategory(transactions, catMap, currentYearMonth);
  const evolution = getSixMonthEvolution(transactions, currentYearMonth);

  // Total Credit Card used limit
  let totalCardsUsed = 0;
  creditCards.forEach((c) => {
    const inv = calculateCreditCardInvoice(c, transactions, currentYearMonth);
    totalCardsUsed += inv.currentInvoice;
  });

  // Calculate Average Monthly Income & Expense
  const evolutionIncomes = evolution.map((e) => e.income);
  const evolutionExpenses = evolution.map((e) => e.expense);
  const avgIncome = evolutionIncomes.reduce((a, b) => a + b, 0) / (evolution.length || 1);
  const avgExpense = evolutionExpenses.reduce((a, b) => a + b, 0) / (evolution.length || 1);

  // Top Category
  const topCategory = expensesByCat.length > 0 ? expensesByCat[0] : null;

  // Top Client by billed total in projects/income
  let topClientName = 'Nenhum';
  let topClientTotal = 0;
  clients.forEach((c) => {
    const clientTotal = transactions
      .filter((t) => t.clientId === c.id && t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
    if (clientTotal > topClientTotal) {
      topClientTotal = clientTotal;
      topClientName = c.name;
    }
  });

  // Upcoming payables and receivables
  const today = getTodayDateString();
  const upcomingBills = transactions
    .filter((t) => t.status !== 'completed' && t.date >= today)
    .sort((a, b) => safeCompare(a.date, b.date))
    .slice(0, 5);

  const overdueBills = transactions
    .filter((t) => t.status === 'overdue' || (t.status === 'pending' && t.date < today))
    .slice(0, 3);

  // Recent transactions
  const recentTransactions = transactions.filter(t => !t.isProjectForecast && t.date <= getTodayDateString())
    .sort((a, b) => safeCompare(b.date, a.date) || safeCompare(b.createdAt, a.createdAt))
    .slice(0, 6);

  // Maximum value for evolution chart bar scale
  const maxBarValue = Math.max(
    ...evolution.map((e) => Math.max(e.income, e.expense)),
    1000
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Smart Financial Summary Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
              Resumo Inteligente • {formatMonthYear(currentYearMonth)}
            </span>
            <p className="text-sm font-medium text-slate-200">
              Você recebeu <strong className="text-emerald-400">{formatCurrency(summary.totalIncome)}</strong> este mês e realizou <strong className="text-rose-400">{formatCurrency(summary.totalExpense)}</strong> em despesas.
              Seu resultado líquido é de{' '}
              <strong className={summary.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {formatCurrency(summary.netResult)}
              </strong>
              {summary.totalIncome > 0 && ` (taxa de economia: ${summary.savingsRate.toFixed(0)}%)`}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAIModal}
          className="self-stretch sm:self-auto py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Lançar por Voz / Texto</span>
        </button>
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueBills.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between gap-3 text-rose-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>
              Atenção: Você possui <strong>{overdueBills.length}</strong> conta(s) em atraso somando{' '}
              <strong>
                {formatCurrency(overdueBills.reduce((acc, b) => acc + b.amount, 0))}
              </strong>
              .
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('payables')}
            className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold transition shrink-0"
          >
            Ver Contas
          </button>
        </div>
      )}

      {/* 6 Core Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Saldo Atual */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Atual
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-white block truncate">
              {formatCurrency(totalAvailable)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Em {accounts.length} contas</span>
          </div>
        </div>

        {/* 2. Entradas do Mês */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Entradas
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400 block truncate">
              {formatCurrency(summary.totalIncome)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {summary.completedIncomeCount} recebimentos
            </span>
          </div>
        </div>

        {/* 3. Saídas do Mês */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
              Saídas
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-rose-400 block truncate">
              {formatCurrency(summary.totalExpense)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {summary.completedExpenseCount} despesas pagas
            </span>
          </div>
        </div>

        {/* 4. Resultado do Mês */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Resultado
            </span>
            <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span
              className={`text-lg sm:text-xl font-extrabold block truncate ${
                summary.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(summary.netResult)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Entradas - Saídas</span>
          </div>
        </div>

        {/* 5. Recebimentos Pendentes */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">
              A Receber
            </span>
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-teal-400 block truncate">
              {formatCurrency(summary.pendingReceivables)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Previsão no mês</span>
          </div>
        </div>

        {/* 6. Contas a Pagar */}
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              A Pagar
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-lg sm:text-xl font-extrabold text-amber-400 block truncate">
              {formatCurrency(summary.pendingPayables)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Contas pendentes</span>
          </div>
        </div>
      </div>

      {/* Secondary Indicators Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block">
            Média Mensal Receitas
          </span>
          <span className="text-sm font-bold text-slate-200 block mt-0.5">{formatCurrency(avgIncome)}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block">
            Média Mensal Despesas
          </span>
          <span className="text-sm font-bold text-slate-200 block mt-0.5">{formatCurrency(avgExpense)}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block">
            Maior Categoria de Gasto
          </span>
          <span className="text-sm font-bold text-slate-200 block mt-0.5 truncate">
            {topCategory ? `${topCategory.name} (${formatCurrency(topCategory.total)})` : 'Nenhum'}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 font-semibold uppercase block">
            Total em Faturas de Cartão
          </span>
          <span className="text-sm font-bold text-purple-400 block mt-0.5">{formatCurrency(totalCardsUsed)}</span>
        </div>
      </div>

      {/* Charts Section: 6-Month Evolution & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Evolution Chart */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Evolução Financeira (Últimos 6 Meses)
                </h3>
                <p className="text-xs text-slate-400">Comparativo histórico de receitas vs despesas</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Receitas
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Despesas
                </span>
              </div>
            </div>

            {/* Custom Interactive CSS Bar Chart */}
            <div className="pt-6 pb-2">
              <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-44 border-b border-slate-800 pb-2">
                {evolution.map((point) => {
                  const incomeHeight = Math.max(4, (point.income / maxBarValue) * 100);
                  const expenseHeight = Math.max(4, (point.expense / maxBarValue) * 100);
                  return (
                    <div key={point.monthKey} className="flex flex-col items-center h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-36">
                        {/* Income Bar */}
                        <div
                          style={{ height: `${incomeHeight}%` }}
                          title={`Receitas: ${formatCurrency(point.income)}`}
                          className="w-3 sm:w-5 bg-emerald-500 rounded-t-md hover:bg-emerald-400 transition-all cursor-pointer relative group-hover:scale-y-105"
                        />
                        {/* Expense Bar */}
                        <div
                          style={{ height: `${expenseHeight}%` }}
                          title={`Despesas: ${formatCurrency(point.expense)}`}
                          className="w-3 sm:w-5 bg-rose-500 rounded-t-md hover:bg-rose-400 transition-all cursor-pointer relative group-hover:scale-y-105"
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-2">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Comparativo de receitas e despesas no período</span>
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              Ver Relatório Completo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expenses by Category */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Despesas por Categoria</h3>
              <span className="text-xs text-slate-400">{expensesByCat.length} categorias</span>
            </div>

            {expensesByCat.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Nenhuma despesa registrada no mês atual.
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {expensesByCat.slice(0, 5).map((cat) => (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5 truncate max-w-[150px]">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                      <span className="font-bold text-white">
                        {formatCurrency(cat.total)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({cat.percentage.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    {/* Progress track */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              Ver todas as categorias <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming Due Dates & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Vencimentos */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Próximos Vencimentos
              </h3>
              <p className="text-xs text-slate-400">Contas a pagar e recebimentos agendados</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('payables')}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              Ver todas
            </button>
          </div>

          {upcomingBills.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhum vencimento pendente para os próximos dias.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBills.map((bill) => {
                const isIncome = bill.type === 'income';
                return (
                  <div
                    key={bill.id}
                    onClick={() => onSelectTransaction(bill)}
                    className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{bill.description}</span>
                        <span className="text-[10px] text-slate-400 block">
                          Vence em {formatDate(bill.date)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-extrabold shrink-0 ml-2 ${
                        isIncome ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {formatCurrency(bill.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimos Lançamentos */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Últimos Lançamentos
              </h3>
              <p className="text-xs text-slate-400">Atividades financeiras mais recentes</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-emerald-400 font-semibold hover:underline"
            >
              Ver histórico
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Você ainda não possui lançamentos cadastrados.
              <button
                type="button"
                onClick={() => onOpenNewTransaction('expense')}
                className="mt-2 block mx-auto text-emerald-400 font-semibold"
              >
                + Adicionar lançamento
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => {
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {isIncome ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{tx.description}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {formatShortDate(tx.date)} • {categories.find((c) => c.id === tx.categoryId)?.name || 'Geral'}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-extrabold shrink-0 ml-2 ${
                        isIncome ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
