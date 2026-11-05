import React, { useState, useEffect } from 'react';
import { X, Target, Calendar, DollarSign } from 'lucide-react';
import { Account, Goal } from '../../types';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: Partial<Goal>) => void;
  goalToEdit?: Goal | null;
  accounts: Account[];
  userId: string;
}

export function GoalModal({
  isOpen,
  onClose,
  onSave,
  goalToEdit,
  accounts,
  userId,
}: GoalModalProps) {
  const [name, setName] = useState('');
  const [targetValueStr, setTargetValueStr] = useState('');
  const [currentValueStr, setCurrentValueStr] = useState('0');
  const [deadline, setDeadline] = useState(`${new Date().getFullYear()}-12-31`);
  const [linkedAccountId, setLinkedAccountId] = useState(accounts[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    if (goalToEdit) {
      setName(goalToEdit.name);
      setTargetValueStr(String(goalToEdit.targetValue));
      setCurrentValueStr(String(goalToEdit.currentValue));
      setDeadline(goalToEdit.deadline);
      setLinkedAccountId(goalToEdit.linkedAccountId || accounts[0]?.id || '');
      setNotes(goalToEdit.notes || '');
    } else {
      setName('');
      setTargetValueStr('10000');
      setCurrentValueStr('0');
      setDeadline(`${new Date().getFullYear()}-12-31`);
      setLinkedAccountId(accounts[0]?.id || '');
      setNotes('');
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const targetValue = parseFloat(targetValueStr.replace(',', '.'));
    const currentValue = parseFloat(currentValueStr.replace(',', '.')) || 0;

    if (!name.trim()) {
      setErrorMessage('Informe o nome da meta.');
      return;
    }
    if (isNaN(targetValue) || targetValue <= 0) {
      setErrorMessage('Informe um valor objetivo válido maior que zero.');
      return;
    }

    const goalId = goalToEdit?.id || `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    onSave({
      id: goalId,
      userId,
      name: name.trim(),
      targetValue,
      currentValue,
      deadline,
      linkedAccountId: linkedAccountId || undefined,
      notes: notes.trim() || undefined,
      createdAt: goalToEdit?.createdAt || getTodayDateString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {goalToEdit ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
              </h2>
              <p className="text-xs text-slate-400">Planeje compras de equipamentos e reservas</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome da Meta
            </label>
            <input
              type="text"
              placeholder="ex: Comprar Sony FX30, Reserva 6 Meses, Viagem..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                Valor Objetivo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="10000,00"
                value={targetValueStr}
                onChange={(e) => setTargetValueStr(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 rounded-2xl p-3 text-white font-bold outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Valor Atual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={currentValueStr}
                onChange={(e) => setCurrentValueStr(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 rounded-2xl p-3 text-white font-bold outline-none transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Prazo Estimado
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Conta Vinculada
              </label>
              <select
                value={linkedAccountId}
                onChange={(e) => setLinkedAccountId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="">Nenhuma / Geral</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações
            </label>
            <input
              type="text"
              placeholder="ex: Guardar 15% de cada projeto de vídeo entregue"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-amber-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
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
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-xl shadow-amber-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Salvar Meta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
