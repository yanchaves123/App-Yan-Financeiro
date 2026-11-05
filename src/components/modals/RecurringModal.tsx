import { useDefaultDate } from '../../hooks/useCalendar';
import React, { useState, useEffect } from 'react';
import {
  X,
  Repeat,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CreditCard as CardIcon,
  Wallet,
  Tag,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { Account, Category, Client, CreditCard, PaymentMethod, RecurringTransaction } from '../../types';
import { getTodayDateString } from '../../lib/formatters';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<RecurringTransaction>, generateOccurrences: boolean) => void;
  recurringToEdit?: RecurringTransaction | null;
  categories: Category[];
  accounts: Account[];
  creditCards: CreditCard[];
  clients: Client[];
  userId: string;
}

export function RecurringModal({
  isOpen,
  onClose,
  onSave,
  recurringToEdit,
  categories,
  accounts,
  creditCards,
  clients,
  userId,
}: RecurringModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [periodicity, setPeriodicity] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [dueDay, setDueDay] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [paymentTarget, setPaymentTarget] = useState<'account' | 'card'>('account');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [creditCardId, setCreditCardId] = useState(creditCards[0]?.id || '');
  const [clientId, setClientId] = useState('');
  const [startDate, setStartDate, resetStartDate] = useDefaultDate(isOpen, !!recurringToEdit);
  const [endDate, setEndDate] = useState('');
  const [generateFuture, setGenerateFuture] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    if (recurringToEdit) {
      setType(recurringToEdit.type);
      setDescription(recurringToEdit.description);
      setAmountStr(String(recurringToEdit.amount));
      setPeriodicity(recurringToEdit.periodicity);
      setDueDay(recurringToEdit.dueDay || 10);
      setCategoryId(recurringToEdit.categoryId);
      if (recurringToEdit.creditCardId) {
        setPaymentTarget('card');
        setCreditCardId(recurringToEdit.creditCardId);
      } else {
        setPaymentTarget('account');
        setAccountId(recurringToEdit.accountId || accounts[0]?.id || '');
      }
      setClientId(recurringToEdit.clientId || '');
      setStartDate(recurringToEdit.startDate);
      setEndDate(recurringToEdit.endDate || '');
    } else {
      setType('expense');
      setDescription('');
      setAmountStr('');
      setPeriodicity('monthly');
      setDueDay(10);
      setPaymentTarget('account');
      setAccountId(accounts[0]?.id || '');
      setCreditCardId(creditCards[0]?.id || '');
      setClientId('');
      resetStartDate();
      setEndDate('');
      setGenerateFuture(true);
    }
  }, [recurringToEdit?.id, isOpen]);

  // Set default category according to type without overriding user selections
  useEffect(() => {
    if (recurringToEdit) return;

    const validCategories = categories.filter((c) =>
      type === 'income' ? c.type === 'income' : c.type !== 'income'
    );
    const currentIsValid = validCategories.some((c) => c.id === categoryId);
    if (!currentIsValid && validCategories.length > 0) {
      setCategoryId(validCategories[0].id);
    }
  }, [type, categories, recurringToEdit]);

  if (!isOpen) return null;

  const professionalExpenses = categories.filter((c) => c.type === 'expense_professional');
  const personalExpenses = categories.filter((c) => c.type === 'expense_personal');
  const incomes = categories.filter((c) => c.type === 'income');
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (!description.trim()) {
      setErrorMessage('Informe a descrição da recorrência.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Informe um valor válido maior que zero.');
      return;
    }

    onSave(
      {
        id: recurringToEdit?.id,
        userId,
        type,
        description: description.trim(),
        amount,
        periodicity,
        dueDay: Number(dueDay),
        categoryId,
        accountId: paymentTarget === 'account' ? accountId : undefined,
        creditCardId: paymentTarget === 'card' ? creditCardId : undefined,
        paymentMethod: paymentTarget === 'card' ? 'credit_card' : 'bank_slip',
        clientId: type === 'income' ? clientId || undefined : undefined,
        startDate,
        endDate: endDate ? endDate : undefined,
        active: recurringToEdit ? recurringToEdit.active : true,
        createdAt: recurringToEdit?.createdAt || new Date().toISOString(),
      },
      generateFuture
    );
    onClose();
  };

  const applyPreset = (presetDesc: string, presetAmount: number, presetType: 'income' | 'expense') => {
    setDescription(presetDesc);
    setAmountStr(String(presetAmount));
    setType(presetType);
    if (presetType === 'income') {
      const contractCat = categories.find((c) => c.name.toLowerCase().includes('contrato') || c.type === 'income');
      if (contractCat) setCategoryId(contractCat.id);
    } else {
      const softCat = categories.find((c) => c.name.toLowerCase().includes('software') || c.name.toLowerCase().includes('internet'));
      if (softCat) setCategoryId(softCat.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {recurringToEdit ? 'Editar Recorrência' : 'Nova Recorrência'}
              </h2>
              <p className="text-xs text-slate-400">
                Assinaturas fixas, despesas periódicas ou contratos mensais de clientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800/80">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Despesa Fixa (Assinatura)
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Receita Fixa (Contrato)
            </button>
          </div>

          {/* Quick Presets for Videomakers */}
          {!recurringToEdit && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Sugestões:
              </span>
              <button
                type="button"
                onClick={() => applyPreset('Adobe Creative Cloud', 289, 'expense')}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition"
              >
                Adobe (R$ 289)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Internet Fibra 1GB', 160, 'expense')}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition"
              >
                Internet (R$ 160)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Google One / Cloud', 38.9, 'expense')}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition"
              >
                Cloud (R$ 38,90)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('Contrato Mensal de Vídeos', 2400, 'income')}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-emerald-300 font-medium transition"
              >
                Contrato Cliente (R$ 2.400)
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              placeholder={
                type === 'income'
                  ? 'ex: Contrato Mensal Vídeos Academia FitCorp'
                  : 'ex: Adobe Creative Cloud / Internet Fibra'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          {/* Amount & Periodicity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Valor Periódico (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  required
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl py-3 pl-11 pr-3 text-base font-bold text-white outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Periodicidade
              </label>
              <select
                value={periodicity}
                onChange={(e) => setPeriodicity(e.target.value as any)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="monthly">Mensal (Todo mês)</option>
                <option value="weekly">Semanal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          {/* Due Day & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Dia de Cobrança / Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value, 10))}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Categoria
                </label>
                {selectedCategory && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      selectedCategory.type === 'expense_professional'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : selectedCategory.type === 'expense_personal'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {selectedCategory.type === 'expense_professional'
                      ? '💼 Profissional'
                      : selectedCategory.type === 'expense_personal'
                      ? '🏠 Pessoal'
                      : '💰 Receita'}
                  </span>
                )}
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                {type === 'income' ? (
                  <optgroup label="Receitas">
                    {incomes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <>
                    <optgroup label="💼 Despesas Profissionais (Videomaker / Negócio)">
                      {professionalExpenses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🏠 Despesas Pessoais">
                      {personalExpenses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* If Income: Client Selection */}
          {type === 'income' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                Cliente do Contrato (Opcional)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="">Selecione o cliente contratante...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* If Expense: Choose Account or Credit Card */
            <div className="space-y-3">
              <div className="flex gap-4 items-center text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="paymentTarget"
                    checked={paymentTarget === 'account'}
                    onChange={() => setPaymentTarget('account')}
                    className="accent-blue-500"
                  />
                  <span>Débito em Conta Bancária</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="radio"
                    name="paymentTarget"
                    checked={paymentTarget === 'card'}
                    onChange={() => setPaymentTarget('card')}
                    className="accent-blue-500"
                  />
                  <span>Cobrado no Cartão de Crédito</span>
                </label>
              </div>

              {paymentTarget === 'account' ? (
                <div>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.institution})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <select
                    value={creditCardId}
                    onChange={(e) => setCreditCardId(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
                  >
                    {creditCards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.institution})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Dates: Start Date & Optional End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data de Término (Opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Sem data final"
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Auto-generate future transactions checkbox */}
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex items-start gap-2.5">
            <input
              type="checkbox"
              id="genFuture"
              checked={generateFuture}
              onChange={(e) => setGenerateFuture(e.target.checked)}
              className="mt-1 accent-blue-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="genFuture" className="text-xs text-blue-200 cursor-pointer">
              <strong className="block font-semibold text-white">
                Gerar automaticamente lançamentos futuros
              </strong>
              Cria as previsões nos próximos meses para manter o dashboard, contas a pagar e contas a receber 100% atualizados.
            </label>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Salvar Recorrência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
