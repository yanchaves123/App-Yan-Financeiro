import React, { useState, useEffect } from 'react';
import { X, CreditCard as CardIcon } from 'lucide-react';
import { Account, CreditCard } from '../../types';

interface CreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Partial<CreditCard>) => void;
  cardToEdit?: CreditCard | null;
  accounts: Account[];
  userId: string;
}

export function CreditCardModal({
  isOpen,
  onClose,
  onSave,
  cardToEdit,
  accounts,
  userId,
}: CreditCardModalProps) {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [limitStr, setLimitStr] = useState('');
  const [closingDay, setClosingDay] = useState(10);
  const [dueDay, setDueDay] = useState(12);
  const [color, setColor] = useState('#820ad1');
  const [paymentAccountId, setPaymentAccountId] = useState(accounts[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    if (cardToEdit) {
      setName(cardToEdit.name);
      setInstitution(cardToEdit.institution);
      setLimitStr(String(cardToEdit.limit));
      setClosingDay(cardToEdit.closingDay);
      setDueDay(cardToEdit.dueDay);
      setColor(cardToEdit.color);
      setPaymentAccountId(cardToEdit.paymentAccountId || accounts[0]?.id || '');
    } else {
      setName('');
      setInstitution('Nubank');
      setLimitStr('5000');
      setClosingDay(10);
      setDueDay(12);
      setColor('#820ad1');
      setPaymentAccountId(accounts[0]?.id || '');
    }
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const limit = parseFloat(limitStr.replace(',', '.'));
    if (!name.trim()) {
      setErrorMessage('Informe o nome do cartão.');
      return;
    }
    if (isNaN(limit) || limit <= 0) {
      setErrorMessage('Informe um limite válido maior que zero.');
      return;
    }

    const cardId = cardToEdit?.id || `card_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    onSave({
      id: cardId,
      userId,
      name: name.trim(),
      institution: institution.trim() || 'Cartão',
      limit,
      closingDay: Number(closingDay),
      dueDay: Number(dueDay),
      color,
      paymentAccountId: paymentAccountId || undefined,
    });
    onClose();
  };

  const applyCardPreset = (presetName: string, inst: string, presetLimit: number, closeD: number, dueD: number, presetColor: string) => {
    setName(presetName);
    setInstitution(inst);
    setLimitStr(String(presetLimit));
    setClosingDay(closeD);
    setDueDay(dueD);
    setColor(presetColor);
  };

  const presetColors = ['#ff7a00', '#009ee3', '#820ad1', '#2563eb', '#059669', '#dc2626', '#f59e0b', '#0f172a'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <CardIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {cardToEdit ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
              </h2>
              <p className="text-xs text-slate-400">Gerencie limites e datas de fatura</p>
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
          {!cardToEdit && (
            <div>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Preenchimento Rápido (Bancos Populares)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    applyCardPreset('Inter Mastercard Black', 'Banco Inter', 6000, 10, 17, '#ff7a00')
                  }
                  className="p-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff7a00]" />
                  Banco Inter
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyCardPreset('Mercado Pago Visa', 'Mercado Pago', 4500, 3, 10, '#009ee3')
                  }
                  className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#009ee3]" />
                  Mercado Pago
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyCardPreset('Nubank Ultravioleta', 'Nubank', 8000, 5, 12, '#820ad1')
                  }
                  className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#820ad1]" />
                  Nubank
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyCardPreset('Ourocard Platinum', 'Banco do Brasil', 7000, 20, 28, '#facc15')
                  }
                  className="p-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
                  Banco do Brasil
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome do Cartão
            </label>
            <input
              type="text"
              placeholder="ex: Nubank Ultravioleta, Itaú Black..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Instituição / Banco
              </label>
              <input
                type="text"
                placeholder="ex: Nubank, Inter, Itaú"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Limite Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="8000,00"
                value={limitStr}
                onChange={(e) => setLimitStr(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white font-bold outline-none transition text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Dia de Fechamento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={(e) => setClosingDay(parseInt(e.target.value, 10))}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Dia de Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value, 10))}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Conta de Pagamento Padrão
            </label>
            <select
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
            >
              <option value="">Selecione uma conta...</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.institution})
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Cor do Cartão
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
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Salvar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
