import { useDefaultDate } from '../../hooks/useCalendar';
import { splitInstallments, addMonths, isValidDate } from '../../lib/finance';
import React, { useState, useEffect } from 'react';
import { X, CreditCard as CardIcon, ShoppingBag, Calendar, Tag } from 'lucide-react';
import { Category, CreditCard, Transaction } from '../../types';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';

interface CreditCardPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditCards: CreditCard[];
  categories: Category[];
  onSaveInstallments: (installments: Transaction[]) => void | boolean;
  userId: string;
}

export function CreditCardPurchaseModal({
  isOpen,
  onClose,
  creditCards,
  categories,
  onSaveInstallments,
  userId,
}: CreditCardPurchaseModalProps) {
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [description, setDescription] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState(1);
  const [firstDate, setFirstDate, resetFirstDate] = useDefaultDate(isOpen, false);
  const [categoryId, setCategoryId] = useState(categories.find((c) => c.type !== 'income')?.id || categories[0]?.id || '');
  const [errorMessage, setErrorMessage] = useState('');

  const totalAmount = parseFloat(totalAmountStr.replace(',', '.')) || 0;
  const installmentValue = installmentsCount > 0 ? totalAmount / installmentsCount : 0;

  useEffect(() => {
    if (!isOpen) return;
    setDescription(''); setTotalAmountStr(''); setInstallmentsCount(1); setErrorMessage('');
    setCreditCardId(creditCards[0]?.id || '');
    setCategoryId(categories.find(c => c.type !== 'income')?.id || '');
  }, [isOpen]);
  useEffect(() => {
    if (!creditCardId && creditCards[0]) setCreditCardId(creditCards[0].id);
    if (!categoryId) setCategoryId(categories.find(c => c.type !== 'income')?.id || '');
  }, [creditCards, categories, creditCardId, categoryId]);
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!description.trim()) {
      setErrorMessage('Informe a descrição da compra.');
      return;
    }
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      setErrorMessage('Informe um valor válido maior que zero.');
      return;
    }

    const parentPurchaseId = `purchase_${Date.now()}`;
    const generatedInstallments: Transaction[] = [];

    if (!creditCards.some(c => c.id === creditCardId) || !categoryId || !isValidDate(firstDate)) {
      setErrorMessage('Selecione um cartão, categoria e data válidos.');
      return;
    }
    let amounts: number[];
    try { amounts = splitInstallments(totalAmount, installmentsCount); }
    catch (error) { setErrorMessage((error as Error).message); return; }
    for (let i = 1; i <= installmentsCount; i++) {
      const installmentDate = addMonths(firstDate, i - 1);
      const desc =
        installmentsCount > 1
          ? `${description.trim()} (${String(i).padStart(2, '0')}/${String(installmentsCount).padStart(2, '0')})`
          : description.trim();

      generatedInstallments.push({
        id: `inst_${parentPurchaseId}_${i}`,
        userId,
        type: 'expense',
        description: desc,
        amount: amounts[i - 1],
        date: installmentDate,
        categoryId,
        paymentMethod: 'credit_card',
        creditCardId,
        installmentCurrent: i,
        installmentTotal: installmentsCount,
        parentPurchaseId,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });
    }

    try {
      if (onSaveInstallments(generatedInstallments) !== false) onClose();
    } catch (error) { setErrorMessage((error as Error).message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <CardIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Compra no Cartão / Parcelamento</h2>
              <p className="text-xs text-slate-400">Primeira parcela no mês seguinte, no vencimento do cartão</p>
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
          {/* Card Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <CardIcon className="w-3.5 h-3.5 text-purple-400" />
              Cartão Utilizado
            </label>
            <select
              value={creditCardId}
              onChange={(e) => setCreditCardId(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
            >
              {creditCards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.institution}) - Vence dia {c.dueDay}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              Descrição da Compra
            </label>
            <input
              type="text"
              placeholder="ex: Câmera Sony FX30 / Lente 24-70mm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          {/* Amount & Installments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Valor Total (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="6000,00"
                  value={totalAmountStr}
                  onChange={(e) => setTotalAmountStr(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl py-3 pl-11 pr-3 text-base font-bold text-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Parcelas
              </label>
              <select
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(parseInt(e.target.value, 10))}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white font-semibold outline-none transition text-sm cursor-pointer"
              >
                <option value={1}>1x à vista ({formatCurrency(totalAmount)})</option>
                {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((num) => (
                  <option key={num} value={num}>
                    {num}x de {formatCurrency(totalAmount / num)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data da Compra
              </label>
              <input
                type="date"
                value={firstDate}
                onChange={(e) => setFirstDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                {categories
                  .filter((c) => c.type !== 'income')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.type === 'expense_professional' ? '💼' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {installmentsCount > 1 && totalAmount > 0 && (
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-200">
              <span className="font-semibold block mb-1">Resumo das Parcelas:</span>
              O sistema criará {installmentsCount} lançamentos automáticos de {formatCurrency(installmentValue)} cada, distribuídos pelos próximos {installmentsCount} meses.
            </div>
          )}

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
              Criar Compra Parcelada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
