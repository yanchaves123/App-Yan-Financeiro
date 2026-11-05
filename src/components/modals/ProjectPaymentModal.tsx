import { useDefaultDate } from '../../hooks/useCalendar';
import React, { useState } from 'react';
import { X, CheckCircle, Wallet, Calendar, DollarSign } from 'lucide-react';
import { Account, PaymentMethod, Project } from '../../types';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';

interface ProjectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  accounts: Account[];
  onConfirmPayment: (data: {
    projectId: string;
    amount: number;
    accountId: string;
    paymentMethod: PaymentMethod;
    date: string;
    description: string;
  }) => void;
}

export function ProjectPaymentModal({
  isOpen,
  onClose,
  project,
  accounts,
  onConfirmPayment,
}: ProjectPaymentModalProps) {
  const [amountStr, setAmountStr] = useState(String(project?.pendingValue ?? 0));
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(project?.paymentMethod || 'pix');
  const [date, setDate, resetDate] = useDefaultDate(isOpen, false);
  const [description, setDescription] = useState(`Recebimento: ${project?.name || ''}`);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0 || amount > project.pendingValue) {
      setErrorMessage('Informe um valor válido de recebimento maior que zero.');
      return;
    }

    if (!accounts.some(a => a.id === accountId) || !date) {
      setErrorMessage('Selecione uma conta e uma data válidas.'); return;
    }
    onConfirmPayment({
      projectId: project.id,
      amount,
      accountId: accountId || accounts[0]?.id,
      paymentMethod,
      date,
      description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registrar Recebimento</h2>
              <p className="text-xs text-slate-400">Entrada financeira vinculada ao projeto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-xs text-slate-400 block font-medium">Projeto:</span>
            <span className="text-sm font-bold text-white block mt-0.5">{project.name}</span>
            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-800/80">
              <span className="text-slate-400">Total: {formatCurrency(project.totalValue)}</span>
              <span className="text-amber-400 font-semibold">Pendente: {formatCurrency(project.pendingValue)}</span>
            </div>
          </div>

          {/* Amount to receive */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Valor Recebido
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl py-3 pl-12 pr-4 text-xl font-bold text-white outline-none transition"
              />
            </div>
          </div>

          {/* Account to credit */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
              Creditar na Conta
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.institution})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Forma
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="pix">Pix</option>
                <option value="transfer">Transferência</option>
                <option value="bank_slip">Boleto</option>
                <option value="credit_card">Cartão</option>
                <option value="cash">Dinheiro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Confirmar Recebimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
