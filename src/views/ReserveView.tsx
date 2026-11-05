import React, { useState } from 'react';
import { ShieldCheck, TrendingUp, AlertCircle, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { Account, Transaction } from '../types';
import { calculateEmergencyReserve, calculateTotalAvailableBalance } from '../lib/calculations';
import { formatCurrency } from '../lib/formatters';

interface ReserveViewProps {
  transactions: Transaction[];
  accounts: Account[];
}

export function ReserveView({ transactions, accounts }: ReserveViewProps) {
  const [targetMonths, setTargetMonths] = useState(6);
  const totalAvailable = calculateTotalAvailableBalance(accounts, transactions);

  const reserveInfo = calculateEmergencyReserve(transactions, totalAvailable, targetMonths);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Reserva de Emergência & Segurança
          </h2>
          <p className="text-xs text-slate-400">
            Cálculo dinâmico baseado na média real de despesas mensais do seu negócio e vida pessoal
          </p>
        </div>

        {/* Target Months Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <span className="text-xs text-slate-400 pl-2 font-medium">Meses desejados:</span>
          {[3, 6, 9, 12].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setTargetMonths(num)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                targetMonths === num
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {num}M
            </button>
          ))}
        </div>
      </div>

      {/* Main Reserve Status Hero Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Reserva Líquida Atual
            </span>
            <span className="text-3xl sm:text-4xl font-black text-emerald-400">
              {formatCurrency(reserveInfo.currentReserveAmount)}
            </span>
            <span className="text-xs text-slate-400 block mt-1">
              Equivale a <strong>{reserveInfo.coverageMonths.toFixed(1)} meses</strong> de despesas cobertas
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Meta ({targetMonths} Meses de Despesas)
            </span>
            <span className="text-xl font-extrabold text-white">
              {formatCurrency(reserveInfo.targetReserveAmount)}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Progresso do Fundo de Segurança:</span>
            <span className="font-extrabold text-white">
              {reserveInfo.completionRate.toFixed(0)}% concluído
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                reserveInfo.completionRate >= 100
                  ? 'bg-emerald-500'
                  : reserveInfo.completionRate >= 60
                  ? 'bg-teal-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, reserveInfo.completionRate)}%` }}
            />
          </div>
        </div>

        {/* Safety Feedback message */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3 text-xs">
          {reserveInfo.completionRate >= 100 ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Excelente estabilidade financeira!</strong>
                <span className="text-slate-400">
                  Sua reserva atual cobre integralmente os {targetMonths} meses desejados de operação e custos fixos.
                </span>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-bold">Construindo sua reserva</strong>
                <span className="text-slate-400">
                  Faltam {formatCurrency(Math.max(0, reserveInfo.targetReserveAmount - reserveInfo.currentReserveAmount))} para completar a meta recomendada de {targetMonths} meses.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Burn Rate & Runway Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Gasto Médio Mensal (Burn Rate)
          </span>
          <span className="text-2xl font-black text-white">
            {formatCurrency(reserveInfo.monthlyBurnRate)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Calculado com base no seu histórico</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Tempo de Autonomia (Runway)
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {reserveInfo.coverageMonths.toFixed(1)} Meses
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Sem precisar de novos trabalhos</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
            Recomendação para Videomakers
          </span>
          <span className="text-sm font-bold text-slate-300 block mt-1">
            Mantenha de 6 a 12 meses para amortecer sazonalidades do mercado audiovisual.
          </span>
        </div>
      </div>
    </div>
  );
}
