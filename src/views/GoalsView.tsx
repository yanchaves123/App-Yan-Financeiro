import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Account, Goal } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';

interface GoalsViewProps {
  goals: Goal[];
  accounts: Account[];
  onOpenNewGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onDepositGoal: (goalId: string, amount: number) => void;
}

export function GoalsView({
  goals,
  accounts,
  onOpenNewGoal,
  onEditGoal,
  onDeleteGoal,
  onDepositGoal,
}: GoalsViewProps) {
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmountStr, setDepositAmountStr] = useState('');

  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const totalTarget = goals.reduce((acc, g) => acc + g.targetValue, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.currentValue, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const handleConfirmDeposit = (goalId: string) => {
    const val = parseFloat(depositAmountStr.replace(',', '.'));
    if (isNaN(val) || val <= 0) {
      return;
    }
    onDepositGoal(goalId, val);
    setDepositGoalId(null);
    setDepositAmountStr('');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            Metas Financeiras
          </h2>
          <p className="text-xs text-slate-400">
            Planejamento de novos equipamentos cinematográficos, viagens e reservas
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewGoal}
          className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Global Progress Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider">
            Progresso Geral das Metas
          </span>
          <span className="font-extrabold text-amber-400 text-sm">
            {overallProgress.toFixed(0)}% concluído
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.min(100, overallProgress)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
          <span>Acumulado: <strong className="text-white">{formatCurrency(totalSaved)}</strong></span>
          <span>Objetivo total: <strong className="text-white">{formatCurrency(totalTarget)}</strong></span>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <Target className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-1">Nenhuma meta cadastrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Defina metas como comprar uma nova câmera Sony FX30, drone ou criar sua reserva.
          </p>
          <button
            type="button"
            onClick={onOpenNewGoal}
            className="py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Criar Minha Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((g) => {
            const progress = g.targetValue > 0 ? (g.currentValue / g.targetValue) * 100 : 0;
            const isCompleted = g.currentValue >= g.targetValue;
            const acc = g.linkedAccountId ? accountMap.get(g.linkedAccountId) : null;

            return (
              <div
                key={g.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {g.name}
                        {g.isDemo && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-semibold">
                            Demo
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>Prazo: {formatDate(g.deadline)}</span>
                        {acc && <span>• Conta: {acc.name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditGoal(g)}
                        title="Editar meta"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(g.id)}
                        title="Excluir meta"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {g.notes && <p className="text-xs text-slate-400 mt-2">{g.notes}</p>}

                  {/* Progress Ring / Bar */}
                  <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">Acumulado:</span>
                      <span className="font-extrabold text-white text-base">
                        {formatCurrency(g.currentValue)}{' '}
                        <span className="text-xs text-slate-400 font-normal">
                          / {formatCurrency(g.targetValue)}
                        </span>
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="font-bold text-amber-400">
                        {progress.toFixed(0)}% concluído
                      </span>
                      <span className="text-slate-500">
                        Falta: {formatCurrency(Math.max(0, g.targetValue - g.currentValue))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deposit action */}
                <div className="pt-2 border-t border-slate-800/80">
                  {depositGoalId === g.id ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                          R$
                        </span>
                        <input
                          type="number"
                          placeholder="Valor a guardar"
                          value={depositAmountStr}
                          onChange={(e) => setDepositAmountStr(e.target.value)}
                          autoFocus
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1.5 pl-8 pr-2 text-xs text-white outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConfirmDeposit(g.id)}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDepositGoalId(null)}
                        className="py-1.5 px-2 text-slate-400 hover:text-white text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      {isCompleted ? (
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Meta Atingida com Sucesso!
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Em progresso</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setDepositGoalId(g.id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 transition flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Aportar Valor
                      </button>
                    </div>
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
