import { getTodayDateString, getCurrentMonthYear } from '../lib/formatters';
import React, { useState } from 'react';
import {
  Coins,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  DollarSign,
  User as UserIcon,
  Briefcase,
} from 'lucide-react';
import { Account, Category, Client, Project, Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';

interface ReceivablesViewProps {
  transactions: Transaction[];
  clients: Client[];
  projects: Project[];
  accounts: Account[];
  onOpenNewIncome: () => void;
  onMarkAsReceived: (tx: Transaction) => void;
}

export function ReceivablesView({
  transactions,
  clients,
  projects,
  accounts,
  onOpenNewIncome,
  onMarkAsReceived,
}: ReceivablesViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'overdue' | 'completed'>('pending');

  const today = getTodayDateString();
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const receivables = transactions.filter((t) => t.type === 'income');

  const pendingReceivables = receivables.filter((t) => t.status === 'pending' && t.date >= today);
  const overdueReceivables = receivables.filter(
    (t) => t.status === 'overdue' || (t.status === 'pending' && t.date < today)
  );
  const completedReceivables = receivables.filter((t) => t.status === 'completed');

  const currentList =
    activeTab === 'pending'
      ? pendingReceivables
      : activeTab === 'overdue'
      ? overdueReceivables
      : completedReceivables;

  const totalPending = pendingReceivables.reduce((acc, t) => acc + t.amount, 0);
  const totalOverdue = overdueReceivables.reduce((acc, t) => acc + t.amount, 0);
  const totalCompleted = completedReceivables.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            Contas a Receber
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe recebimentos previstos de clientes, sinais e saldos de projetos
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewIncome}
          className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Recebimento Previsto</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-3xl border shadow-md transition cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-slate-900 border-teal-500/50 ring-1 ring-teal-500/50'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">
            A Receber (No Prazo)
          </span>
          <span className="text-xl font-extrabold text-teal-400">{formatCurrency(totalPending)}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{pendingReceivables.length} faturamentos</span>
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
            Recebimentos Atrasados
          </span>
          <span className="text-xl font-extrabold text-rose-400">{formatCurrency(totalOverdue)}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{overdueReceivables.length} pendências</span>
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
            Já Recebido
          </span>
          <span className="text-xl font-extrabold text-emerald-400">{formatCurrency(totalCompleted)}</span>
          <span className="text-[10px] text-slate-400 block mt-1">{completedReceivables.length} liquidados</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`py-3 px-5 font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          A Receber ({pendingReceivables.length})
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
          Atrasados ({overdueReceivables.length})
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
          Recebidos ({completedReceivables.length})
        </button>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <Coins className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-1">
            {activeTab === 'overdue'
              ? 'Nenhum recebimento em atraso!'
              : activeTab === 'pending'
              ? 'Nenhum faturamento a receber no momento.'
              : 'Nenhum recebimento registrado.'}
          </h3>
        </div>
      ) : (
        <div className="space-y-2.5">
          {currentList.map((rec) => {
            const client = rec.clientId ? clientMap.get(rec.clientId) : null;
            const project = rec.projectId ? projectMap.get(rec.projectId) : null;
            const isCompleted = rec.status === 'completed';
            const isOverdue = rec.status === 'overdue' || (!isCompleted && rec.date < today);

            return (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isOverdue
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-teal-500/20 text-teal-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">{rec.description}</span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className={isOverdue ? 'text-rose-400 font-semibold' : ''}>
                        Prazo: {formatDate(rec.date)}
                      </span>
                      {client && (
                        <>
                          <span>•</span>
                          <span className="text-sky-400 font-medium">{client.name}</span>
                        </>
                      )}
                      {project && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300">Projeto: {project.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <span className="text-base font-extrabold text-emerald-400">
                    {formatCurrency(rec.amount)}
                  </span>

                  {!isCompleted ? (
                    <button
                      type="button"
                      onClick={() => onMarkAsReceived(rec)}
                      className="py-1.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Marcar como Recebido
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Recebido
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
