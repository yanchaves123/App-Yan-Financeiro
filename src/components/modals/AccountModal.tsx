import React, { useState, useEffect } from 'react';
import { X, Wallet } from 'lucide-react';
import { Account, AccountType } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acc: Partial<Account>) => void;
  accountToEdit?: Account | null;
  userId: string;
}

export function AccountModal({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
  userId,
}: AccountModalProps) {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<AccountType>('digital');
  const [initialBalanceStr, setInitialBalanceStr] = useState('0');
  const [color, setColor] = useState('#820ad1');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    if (accountToEdit) {
      setName(accountToEdit.name);
      setInstitution(accountToEdit.institution);
      setType(accountToEdit.type);
      setInitialBalanceStr(String(accountToEdit.initialBalance));
      setColor(accountToEdit.color);
    } else {
      setName('');
      setInstitution('Nubank');
      setType('digital');
      setInitialBalanceStr('0');
      setColor('#820ad1');
    }
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const initialBalance = parseFloat(initialBalanceStr.replace(',', '.')) || 0;
    if (!name.trim()) {
      setErrorMessage('Informe o nome da conta.');
      return;
    }

    const accountId = accountToEdit?.id || `acc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    onSave({
      id: accountId,
      userId,
      name: name.trim(),
      institution: institution.trim() || 'Banco',
      type,
      initialBalance,
      color,
      createdAt: accountToEdit?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  const presetColors = ['#820ad1', '#facc15', '#10b981', '#2563eb', '#0284c7', '#ea580c', '#64748b'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {accountToEdit ? 'Editar Conta' : 'Nova Conta / Carteira'}
              </h2>
              <p className="text-xs text-slate-400">Cadastre suas contas bancárias e carteiras</p>
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
              Nome da Conta
            </label>
            <input
              type="text"
              placeholder="ex: Nubank Principal, BB Corrente, Dinheiro na Carteira"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="digital">Conta Digital</option>
                <option value="checking">Conta Corrente</option>
                <option value="savings">Poupança</option>
                <option value="investment">Investimentos</option>
                <option value="wallet">Carteira</option>
                <option value="cash">Dinheiro Físico</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Instituição
              </label>
              <input
                type="text"
                placeholder="ex: Nubank, Itaú..."
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Saldo Inicial (R$)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={initialBalanceStr}
              onChange={(e) => setInitialBalanceStr(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-2xl p-3 text-white font-bold outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Cor de Identificação
            </label>
            <div className="flex gap-2.5 items-center">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
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
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Salvar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
