import { getTodayDateString, getCurrentMonthYear } from '../lib/formatters';
import { safeCompare, safeStartsWith } from '../lib/safeCompare';
import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Tag,
  Trash2,
  Edit2,
  Play,
  Pause,
  Sparkles,
  CreditCard,
  Wallet,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { Account, Category, Client, CreditCard as CardType, RecurringTransaction, Transaction } from '../types';
import { formatCurrency, formatDate, formatMonthYear } from '../lib/formatters';

interface RecurrencesViewProps {
  recurringList: RecurringTransaction[];
  categories: Category[];
  accounts: Account[];
  creditCards: CardType[];
  clients: Client[];
  transactions?: Transaction[];
  currentYearMonth?: string;
  onOpenNewRecurring: () => void;
  onEditRecurring: (item: RecurringTransaction) => void;
  onDeleteRecurring: (id: string) => void;
  onToggleActive: (id: string) => void;
  onPostRecurringToMonth: (item: RecurringTransaction) => void;
  onSyncAllRecurrences: () => void;
  onToggleTransactionStatus?: (tx: Transaction) => void;
}

export function RecurrencesView({
  recurringList,
  categories,
  accounts,
  creditCards,
  clients,
  transactions = [],
  currentYearMonth = getCurrentMonthYear(),
  onOpenNewRecurring,
  onEditRecurring,
  onDeleteRecurring,
  onToggleActive,
  onPostRecurringToMonth,
  onSyncAllRecurrences,
  onToggleTransactionStatus,
}: RecurrencesViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'paused'>('all');
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));
  const cardMap = new Map(creditCards.map((c) => [c.id, c]));
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  const filtered = recurringList.filter((r) => {
    if (filterType === 'expense') return r.type === 'expense' && r.active;
    if (filterType === 'income') return r.type === 'income' && r.active;
    if (filterType === 'paused') return !r.active;
    return true;
  });

  const activeRecurrences = recurringList.filter((r) => r.active);
  const totalMonthlyExpense = activeRecurrences
    .filter((r) => r.type === 'expense')
    .reduce((acc, r) => acc + r.amount, 0);

  const totalMonthlyIncome = activeRecurrences
    .filter((r) => r.type === 'income')
    .reduce((acc, r) => acc + r.amount, 0);

  const netRecurringBalance = totalMonthlyIncome - totalMonthlyExpense;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-400" />
            Lançamentos Recorrentes
          </h2>
          <p className="text-xs text-slate-400">
            Assinaturas automáticas (Adobe, Cloud), custos fixos e contratos mensais de videomaker
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={onSyncAllRecurrences}
            title="Sincronizar lançamentos nos próximos meses"
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Sincronizar Futuros</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewRecurring}
            className="flex-1 sm:flex-none py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Recorrência</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-1">
            Despesas Fixas Recorrentes
          </span>
          <span className="text-2xl font-black text-rose-400">
            {formatCurrency(totalMonthlyExpense)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            {activeRecurrences.filter((r) => r.type === 'expense').length} assinaturas e custos mensais
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Receitas Fixas (Contratos)
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {formatCurrency(totalMonthlyIncome)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            {activeRecurrences.filter((r) => r.type === 'income').length} contratos recorrentes
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Resultado Recorrente Garantido
          </span>
          <span
            className={`text-2xl font-black ${
              netRecurringBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(netRecurringBalance)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">Margem fixa mensal previsível</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 text-xs overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`py-3 px-4 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            filterType === 'all'
              ? 'border-blue-400 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Todas ({recurringList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('expense')}
          className={`py-3 px-4 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            filterType === 'expense'
              ? 'border-rose-400 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-400" />
          Despesas ({recurringList.filter((r) => r.type === 'expense' && r.active).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('income')}
          className={`py-3 px-4 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            filterType === 'income'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          Receitas ({recurringList.filter((r) => r.type === 'income' && r.active).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('paused')}
          className={`py-3 px-4 font-bold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
            filterType === 'paused'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Pause className="w-3.5 h-3.5 text-amber-400" />
          Pausadas ({recurringList.filter((r) => !r.active).length})
        </button>
      </div>

      {/* Recurrences List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <Repeat className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-1">Nenhuma recorrência encontrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Cadastre assinaturas como Adobe Creative Cloud, internet fibra ou mensalidades fixas de contratos.
          </p>
          <button
            type="button"
            onClick={onOpenNewRecurring}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Recorrência
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isIncome = item.type === 'income';
            const cat = catMap.get(item.categoryId);
            const acc = item.accountId ? accMap.get(item.accountId) : null;
            const card = item.creditCardId ? cardMap.get(item.creditCardId) : null;
            const client = item.clientId ? clientMap.get(item.clientId) : null;

            // Find occurrence in current selected month
            const currentMonthTx = transactions.find(
              (t) => t.recurrenceId === item.id && safeStartsWith(t.date, currentYearMonth)
            );

            // All occurrences for this recurrence (history & projections)
            const occurrences = transactions
              .filter((t) => t.recurrenceId === item.id)
              .sort((a, b) => safeCompare(b.date, a.date));

            const isExpanded = expandedRecId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-3xl border shadow-md flex flex-col gap-4 transition ${
                  item.active
                    ? 'bg-slate-900 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                }`}
              >
                {/* Main Card Content */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Icon & Info */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        !item.active
                          ? 'bg-slate-800 text-slate-500'
                          : isIncome
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {isIncome ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white truncate">{item.description}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            item.active
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {item.active ? 'Ativo' : 'Pausado'}
                        </span>

                        {/* Status in active month */}
                        {currentMonthTx ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              currentMonthTx.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {currentMonthTx.status === 'completed' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                {formatMonthYear(currentYearMonth)}: Pago
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                {formatMonthYear(currentYearMonth)}: Pendente
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            {formatMonthYear(currentYearMonth)}: Não gerado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          Todo dia {item.dueDay || '10'} ({item.periodicity === 'monthly' ? 'Mensal' : item.periodicity})
                        </span>
                        <span>•</span>
                        <span>{cat?.name || 'Geral'}</span>
                        {card && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-medium" style={{ color: card.color || '#a855f7' }}>
                              <CreditCard className="w-3 h-3" />
                              {card.name}
                            </span>
                          </>
                        )}
                        {acc && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-300">
                              <Wallet className="w-3 h-3" />
                              {acc.name}
                            </span>
                          </>
                        )}
                        {client && (
                          <>
                            <span>•</span>
                            <span className="text-sky-400 font-medium">Cliente: {client.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Action Controls */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                    <div className="text-left sm:text-right">
                      <span
                        className={`text-base font-extrabold block ${
                          !item.active ? 'text-slate-500' : isIncome ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">/mês</span>
                      </span>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* Confirm payment / Post */}
                      {currentMonthTx?.status === 'completed' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleTransactionStatus) {
                              onToggleTransactionStatus(currentMonthTx);
                            }
                          }}
                          title="Clique para marcar como pendente"
                          className="py-1.5 px-3 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold border border-emerald-500/20 transition flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pago</span>
                        </button>
                      ) : currentMonthTx?.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleTransactionStatus) {
                              onToggleTransactionStatus(currentMonthTx);
                            } else {
                              onPostRecurringToMonth(item);
                            }
                          }}
                          title="Confirmar pagamento deste mês agora"
                          className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1 active:scale-95"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Confirmar Pagamento</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onPostRecurringToMonth(item)}
                          title="Lançar agora no mês selecionado"
                          className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1 active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Lançar no Mês</span>
                        </button>
                      )}

                      {/* Expand Occurrences / History */}
                      <button
                        type="button"
                        onClick={() => setExpandedRecId(isExpanded ? null : item.id)}
                        title="Ver histórico de previsões e lançamentos gerados"
                        className={`p-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1 ${
                          isExpanded
                            ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        <span className="text-[11px] font-bold">{occurrences.length}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Pause / Resume */}
                      <button
                        type="button"
                        onClick={() => onToggleActive(item.id)}
                        title={item.active ? 'Pausar recorrência' : 'Reativar recorrência'}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        {item.active ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEditRecurring(item)}
                        title="Editar recorrência"
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteRecurring(item.id)}
                        title="Excluir recorrência"
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Occurrences / History List */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-800/80 animate-fade-in space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span className="font-bold text-slate-300">
                        Ocorrências Geradas ({occurrences.length})
                      </span>
                      <span>Histórico e Previsões Futuras</span>
                    </div>

                    {occurrences.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl">
                        Nenhum lançamento gerado ainda. Clique em "Lançar no Mês" ou "Sincronizar Futuros".
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {occurrences.map((occ) => (
                          <div
                            key={occ.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                              occ.status === 'completed'
                                ? 'bg-slate-950/70 border-emerald-500/20'
                                : 'bg-slate-950/50 border-amber-500/20'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-white block">
                                {formatDate(occ.date)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {formatCurrency(occ.amount)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onToggleTransactionStatus && onToggleTransactionStatus(occ)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                                occ.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                              }`}
                            >
                              {occ.status === 'completed' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Pago
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  Pendente
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
