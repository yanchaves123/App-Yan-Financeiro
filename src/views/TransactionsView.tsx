import { safeCompare, safeStartsWith } from '../lib/safeCompare';
import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  X,
  SlidersHorizontal,
  Repeat,
} from 'lucide-react';
import { Account, Category, Client, CreditCard, Project, Transaction, TransactionStatus, TransactionType } from '../types';
import { formatCurrency, formatDate, formatMonthYear } from '../lib/formatters';

interface TransactionsViewProps {
  currentYearMonth: string;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  creditCards: CreditCard[];
  clients: Client[];
  projects: Project[];
  onOpenNewTransaction: (type?: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleStatus: (tx: Transaction) => void;
}

export function TransactionsView({
  currentYearMonth,
  transactions,
  categories,
  accounts,
  creditCards,
  clients,
  projects,
  onOpenNewTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
}: TransactionsViewProps) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'current' | 'all'>('current');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Category & Account fast lookup
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Period filter
      if (filterPeriod === 'current' && !safeStartsWith(t.date, currentYearMonth)) {
        return false;
      }
      // Type filter
      if (filterType === 'recurring') {
        if (!t.isRecurring) return false;
      } else if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }
      // Category filter
      if (filterCategory !== 'all' && t.categoryId !== filterCategory) {
        return false;
      }
      // Account filter
      if (filterAccount !== 'all' && t.accountId !== filterAccount && t.destinationAccountId !== filterAccount) {
        return false;
      }
      // Status filter
      if (filterStatus !== 'all' && t.status !== filterStatus) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesObs = t.observations?.toLowerCase().includes(query);
        const client = t.clientId ? clientMap.get(t.clientId) : null;
        const matchesClient = client?.name.toLowerCase().includes(query);
        const proj = t.projectId ? projectMap.get(t.projectId) : null;
        const matchesProj = proj?.name.toLowerCase().includes(query);
        if (!matchesDesc && !matchesObs && !matchesClient && !matchesProj) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return safeCompare(b.date, a.date) || safeCompare(b.createdAt, a.createdAt);
      if (sortBy === 'date_asc') return safeCompare(a.date, b.date) || safeCompare(a.createdAt, b.createdAt);
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [
    transactions,
    currentYearMonth,
    filterPeriod,
    filterType,
    filterCategory,
    filterAccount,
    filterStatus,
    searchTerm,
    sortBy,
    clientMap,
    projectMap,
  ]);

  // Compute summary of currently filtered items
  const filteredTotalIncome = filteredTransactions
    .filter((t) => t.type === 'income' && t.status === 'completed')
    .reduce((a, b) => a + b.amount, 0);

  const filteredTotalExpense = filteredTransactions
    .filter((t) => t.type === 'expense' && !t.isCardInvoicePayment && t.status === 'completed')
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Header with Title and Add Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Lançamentos</h2>
          <p className="text-xs text-slate-400">
            {filterPeriod === 'current'
              ? `Exibindo movimentações de ${formatMonthYear(currentYearMonth)}`
              : 'Exibindo todos os períodos'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => onOpenNewTransaction('expense')}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenNewTransaction('income')}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Nova Receita</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição, cliente, projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick period toggle & mobile filter button */}
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilterPeriod('current')}
                className={`py-1.5 px-3 rounded-xl font-semibold transition ${
                  filterPeriod === 'current' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => setFilterPeriod('all')}
                className={`py-1.5 px-3 rounded-xl font-semibold transition ${
                  filterPeriod === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="md:hidden p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        {/* Detailed Filters (Always visible on desktop, toggle on mobile) */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80 ${showFiltersMobile ? 'block' : 'hidden md:grid'}`}>
          {/* Type Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">Todos os Tipos</option>
              <option value="income">Receitas (+)</option>
              <option value="expense">Despesas (-)</option>
              <option value="transfer">Transferências</option>
              <option value="recurring">Recorrentes (🔁)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Conta</label>
            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">Todas as Contas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Concluído (Pago/Recebido)</option>
              <option value="pending">Pendente (A Pagar/Receber)</option>
              <option value="overdue">Atrasado</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ordenar</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
            >
              <option value="date_desc">Mais Recentes</option>
              <option value="date_asc">Mais Antigos</option>
              <option value="amount_desc">Maior Valor</option>
              <option value="amount_asc">Menor Valor</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Stats */}
        <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t border-slate-800/80 text-slate-400">
          <span>{filteredTransactions.length} lançamentos encontrados</span>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-semibold">
              Entradas: {formatCurrency(filteredTotalIncome)}
            </span>
            <span className="text-rose-400 font-semibold">
              Saídas: {formatCurrency(filteredTotalExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Nenhum lançamento encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Tente ajustar os filtros ou adicione uma nova receita ou despesa.
          </p>
          <button
            type="button"
            onClick={() => onOpenNewTransaction('income')}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Adicionar Lançamento
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';
            const isCompleted = tx.status === 'completed';
            const category = catMap.get(tx.categoryId);
            const account = tx.accountId ? accMap.get(tx.accountId) : null;
            const destAccount = tx.destinationAccountId ? accMap.get(tx.destinationAccountId) : null;
            const client = tx.clientId ? clientMap.get(tx.clientId) : null;
            const project = tx.projectId ? projectMap.get(tx.projectId) : null;

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800/80 shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Icon & Info */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isTransfer
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownRight className="w-5 h-5" />
                    ) : isTransfer ? (
                      <ArrowRightLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{tx.description}</span>
                      {tx.isRecurring && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30 flex items-center gap-1 shrink-0">
                          <Repeat className="w-2.5 h-2.5" />
                          Recorrente
                        </span>
                      )}
                      {tx.installmentCurrent && tx.installmentTotal && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                          {tx.installmentCurrent}/{tx.installmentTotal}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatDate(tx.date)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-slate-300">
                        {category?.name || 'Geral'}
                      </span>
                      {account && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[120px]">
                            {isTransfer && destAccount
                              ? `${account.name} ➔ ${destAccount.name}`
                              : account.name}
                          </span>
                        </>
                      )}
                      {client && (
                        <>
                          <span>•</span>
                          <span className="text-sky-400 font-medium truncate max-w-[130px]">
                            {client.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Value, Status badge & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-base font-extrabold block ${
                        isIncome ? 'text-emerald-400' : isTransfer ? 'text-indigo-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'} {formatCurrency(tx.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(tx)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1 mt-0.5 transition ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : tx.status === 'overdue'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          {isIncome ? 'Recebido' : 'Pago'}
                        </>
                      ) : tx.status === 'overdue' ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Atrasado
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" />
                          Pendente
                        </>
                      )}
                    </button>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      title="Editar lançamento"
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      title="Excluir lançamento"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
