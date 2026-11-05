import { useDefaultDate } from '../../hooks/useCalendar';
import React, { useState } from 'react';
import { X, ArrowRightLeft, Wallet, Calendar } from 'lucide-react';
import { Account, Transaction } from '../../types';
import { getTodayDateString } from '../../lib/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  accounts: Account[];
}

export function TransferModal({ isOpen, onClose, onSave, accounts }: TransferModalProps) {
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate, resetDate] = useDefaultDate(isOpen, false);
  const [observations, setObservations] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMessage('Por favor, informe um valor válido para transferência.');
      return;
    }
    if (sourceAccountId === destinationAccountId) {
      setErrorMessage('A conta de origem e destino devem ser diferentes.');
      return;
    }

    const sourceAcc = accounts.find((a) => a.id === sourceAccountId);
    const destAcc = accounts.find((a) => a.id === destinationAccountId);

    if (!sourceAcc || !destAcc) {
      setErrorMessage('Selecione contas válidas de origem e destino.');
      return;
    }

    onSave({
      type: 'transfer',
      description: `Transferência: ${sourceAcc?.name || 'Origem'} ➔ ${destAcc?.name || 'Destino'}`,
      amount,
      date,
      categoryId: 'cat_transfer',
      accountId: sourceAccountId,
      destinationAccountId,
      paymentMethod: 'transfer',
      status: 'completed',
      observations: observations.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Transferir Dinheiro</h2>
              <p className="text-xs text-slate-400">Movimentação interna entre contas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Valor da Transferência
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
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl py-3 pl-12 pr-4 text-xl font-bold text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-rose-400" />
                Conta de Origem (Sai o dinheiro)
              </label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.institution})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                Conta de Destino (Entra o dinheiro)
              </label>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.institution})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-white outline-none transition text-sm"
            />
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="ex: Cobertura de cartão ou transferência para investimentos"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Confirmar Transferência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
