import { getTodayDateString, getCurrentMonthYear } from '../lib/formatters';
import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  DollarSign,
  Filter,
} from 'lucide-react';
import { Account, Category, Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';

interface PayablesViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onOpenNewExpense: () => void;
  onMarkAsPaid: (tx: Transaction) => void;
  onEditTransaction: (tx: Transaction) => void;
}

export function PayablesView({
  transactions,
  categories,
  accounts,
  onOpenNewExpense,
  onMarkAsPaid,
  onEditTransaction,
}: PayablesViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'overdue' | 'completed'>('pending');

  const today = getTodayDateString();
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const payables = transactions.filter((t) => t.type === 'expense' && t.paymentMethod !== 'credit_card');

  const pendingPayables = payables.filter((t) => t.status === 'pending' && t.date >= today);
  const overduePayables = payables.filter((t) => t.status === 'overdue' || (t.status === 'pending' && t.date < today));
  const completedPayables = payables.filter((t) => t.status === 'completed');

  const currentList =
    activeTab === 'pending'
      ? pendingPayables
      : activeTab === 'overdue'
      ? overduePayables
      : completedPayables;

  const totalPending = pendingPayables.reduce((acc, t) => acc + t.amount, 0);
  const totalOverdue = overduePayables.reduce((acc, t) => acc + t.amount, 0);
  const totalCompleted = completedPayables.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-rose-400" />
            Contas a Pagar
          </h2>
          <p className="text-xs text-slate-400">
            Gerencie suas despesas agendadas, boletos e vencimentos
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewExpense}
          className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta a Pagar</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-3xl border shadow-md transition cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-slate-900 border-amber-500/50 ring-1 ring-amber-500/50'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
            Próximas Contas
          </span>
          <span className="text-xl font-extrabold text-amber-400">{formatCurrency(totalPending)}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{pendingPayables.length} a vencer</span>
        </div>

        <div
          onClick={() => setActiveTab('overdue')}
          className={`p-4 rounded-3xl border shadow-md transition cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-slate-900 border-rose-500/50 ring-1 ring-rose-500/50'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-1">
            Contas Atrasadas
          </span>
          <span className="text-xl font-extrabold text-rose-400">{formatCurrency(totalOverdue)}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{overduePayables.length} em atraso</span>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-3xl border shadow-md transition cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/50'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Contas Já Pagas
          </span>
          <span className="text-xl font-extrabold text-emerald-400">{formatCurrency(totalCompleted)}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{completedPayables.length} liquidadas</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-5 font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Próximas ({pendingPayables.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('overdue')}
          className={`py-3 px-5 font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'overdue'
              ? 'border-rose-400 text-rose-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Atrasadas ({overduePayables.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`py-3 px-5 font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Pagas ({completedPayables.length})
        </button>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <CalendarClock className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-1">
            {activeTab === 'overdue'
              ? 'Nenhuma conta atrasada!'
              : activeTab === 'pending'
              ? 'Nenhuma conta a vencer nos próximos dias.'
              : 'Nenhuma conta paga encontrada.'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {activeTab === 'overdue' ? 'Parabéns, você está com todos os pagamentos em dia.' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {currentList.map((bill) => {
            const cat = catMap.get(bill.categoryId);
            const acc = bill.accountId ? accMap.get(bill.accountId) : null;
            const isCompleted = bill.status === 'completed';
            const isOverdue = bill.status === 'overdue' || (!isCompleted && bill.date < today);

            return (
              <div
                key={bill.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isOverdue
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <CalendarClock className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">{bill.description}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className={isOverdue ? 'text-rose-400 font-semibold' : ''}>
                        Vencimento: {formatDate(bill.date)}
                      </span>
                      <span>•</span>
                      <span>{cat?.name || 'Geral'}</span>
                      {acc && <span>• {acc.name}</span>}
                      {bill.isRecurring && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 font-medium">
                          Recorrente
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="text-base font-extrabold text-white">
                    {formatCurrency(bill.amount)}
                  </span>

                  {!isCompleted ? (
                    <button
                      type="button"
                      onClick={() => onMarkAsPaid(bill)}
                      className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Marcar como Paga
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Paga
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
