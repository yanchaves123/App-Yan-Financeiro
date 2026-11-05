import { useDefaultDate } from '../../hooks/useCalendar';
import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Calendar, Tag, CreditCard as CardIcon, Wallet, User as UserIcon, Briefcase, Repeat } from 'lucide-react';
import { Account, Category, Client, CreditCard, PaymentMethod, Project, Transaction, TransactionStatus, TransactionType } from '../../types';
import { formatCurrency, getTodayDateString } from '../../lib/formatters';

export interface RecurrenceConfig {
  isRecurring: boolean;
  periodicity: 'monthly' | 'weekly' | 'yearly';
  dueDay: number;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>, recurrenceConfig?: RecurrenceConfig) => void | boolean;
  transactionToEdit?: Transaction | null;
  defaultType?: TransactionType;
  defaultStatus?: TransactionStatus;
  accounts: Account[];
  categories: Category[];
  creditCards: CreditCard[];
  clients: Client[];
  projects: Project[];
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  defaultType = 'expense',
  defaultStatus = 'completed',
  accounts,
  categories,
  creditCards,
  clients,
  projects,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate, resetDate] = useDefaultDate(isOpen, !!transactionToEdit);
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [creditCardId, setCreditCardId] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState<TransactionStatus>('completed');
  const [observations, setObservations] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriodicity, setRecurrencePeriodicity] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [recurrenceDueDay, setRecurrenceDueDay] = useState(10);
  const [errorMessage, setErrorMessage] = useState('');
  const [categoryModalityFilter, setCategoryModalityFilter] = useState<'all' | 'expense_professional' | 'expense_personal'>('all');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmountStr(String(transactionToEdit.amount));
      setDate(transactionToEdit.date);
      setCategoryId(transactionToEdit.categoryId);
      setAccountId(transactionToEdit.accountId || '');
      setPaymentMethod(transactionToEdit.paymentMethod);
      setCreditCardId(transactionToEdit.creditCardId || '');
      setClientId(transactionToEdit.clientId || '');
      setProjectId(transactionToEdit.projectId || '');
      setStatus(transactionToEdit.status);
      setObservations(transactionToEdit.observations || '');
      setIsRecurring(!!transactionToEdit.isRecurring);
      const dayParts = transactionToEdit.date ? parseInt(transactionToEdit.date.split('-')[2] || '10', 10) : 10;
      setRecurrenceDueDay(dayParts);
    } else {
      setType(defaultType);
      setPaymentMethod('pix');
      setRecurrencePeriodicity('monthly');
      setDescription('');
      setAmountStr('');
      resetDate();
      setObservations('');
      setStatus(defaultStatus);
      setCreditCardId(creditCards[0]?.id || '');
      setAccountId(accounts[0]?.id || '');
      setClientId('');
      setProjectId('');
      setIsRecurring(false);
      setRecurrenceDueDay(Number(getTodayDateString().slice(8)));
      setCategoryModalityFilter('all');
      setCategoryId(categories.find(c => defaultType === 'income' ? c.type === 'income' : c.type !== 'income')?.id || '');
    }
  }, [transactionToEdit?.id, defaultType, defaultStatus, isOpen]);

  // Set default category according to type without overriding user selections
  useEffect(() => {
    if (transactionToEdit) return;

    const validCategories = categories.filter((c) =>
      type === 'income' ? c.type === 'income' : c.type !== 'income'
    );
    const currentIsValid = validCategories.some((c) => c.id === categoryId);
    if (!currentIsValid && validCategories.length > 0) {
      setCategoryId(validCategories[0].id);
    }
  }, [type, categories, transactionToEdit]);

  if (!isOpen) return null;

  const professionalExpenses = categories.filter((c) => c.type === 'expense_professional');
  const personalExpenses = categories.filter((c) => c.type === 'expense_personal');
  const incomes = categories.filter((c) => c.type === 'income');
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanAmount = parseFloat(amountStr.replace(',', '.'));
    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0) {
      setErrorMessage('Por favor, informe um valor válido maior que zero.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Por favor, informe a descrição do lançamento.');
      return;
    }

    if (!date || !categoryId || (paymentMethod === 'credit_card' ? !creditCards.some(c => c.id === creditCardId) : !accounts.some(a => a.id === accountId))) {
      setErrorMessage('Selecione uma data, categoria e conta ou cartão válidos.');
      return;
    }

    const saved = onSave(
      {
        ...transactionToEdit,
        id: transactionToEdit?.id,
        type,
        description: description.trim(),
        amount: cleanAmount,
        date,
        purchaseDate: paymentMethod === 'credit_card' ? transactionToEdit?.purchaseDate : undefined,
        categoryId,
        accountId: paymentMethod === 'credit_card' ? undefined : accountId || accounts[0]?.id,
        paymentMethod,
        creditCardId: paymentMethod === 'credit_card' ? creditCardId || creditCards[0]?.id : undefined,
        clientId: clientId || undefined,
        projectId: projectId || undefined,
        status,
        isRecurring,
        observations: observations.trim() || undefined,
      },
      isRecurring
        ? {
            isRecurring: true,
            periodicity: recurrencePeriodicity,
            dueDay: recurrenceDueDay || parseInt(date.split('-')[2] || '10', 10),
          }
        : undefined
    );
    if (saved !== false) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {transactionToEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <p className="text-xs text-slate-400">
                {type === 'income' ? 'Registrar receita ou recebimento' : 'Registrar despesa ou pagamento'}
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
        {!transactionToEdit && (
          <div className="p-4 bg-slate-950/50 border-b border-slate-800/80">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
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
                Receita
              </button>
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
                Despesa
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Amount Field (Big and Clear) */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Valor
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
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl py-3.5 pl-12 pr-4 text-2xl font-bold text-white placeholder-slate-600 outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              placeholder={type === 'income' ? 'ex: Vídeo Festa do Peão' : 'ex: Adobe Creative Cloud / Mercado'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm"
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

              {/* Modality Filter for Expenses (Profissional vs Pessoal) */}
              {type === 'expense' && (
                <div className="flex p-0.5 bg-slate-950 border border-slate-800 rounded-xl mb-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCategoryModalityFilter('all')}
                    className={`flex-1 py-1 rounded-lg font-medium transition ${
                      categoryModalityFilter === 'all'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryModalityFilter('expense_professional');
                      if (selectedCategory?.type !== 'expense_professional' && professionalExpenses.length > 0) {
                        setCategoryId(professionalExpenses[0].id);
                      }
                    }}
                    className={`flex-1 py-1 rounded-lg font-medium transition flex items-center justify-center gap-1 ${
                      categoryModalityFilter === 'expense_professional'
                        ? 'bg-purple-600/40 text-purple-200 border border-purple-500/40 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>💼 Profissional</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryModalityFilter('expense_personal');
                      if (selectedCategory?.type !== 'expense_personal' && personalExpenses.length > 0) {
                        setCategoryId(personalExpenses[0].id);
                      }
                    }}
                    className={`flex-1 py-1 rounded-lg font-medium transition flex items-center justify-center gap-1 ${
                      categoryModalityFilter === 'expense_personal'
                        ? 'bg-amber-600/40 text-amber-200 border border-amber-500/40 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🏠 Pessoal</span>
                  </button>
                </div>
              )}

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                {type === 'income' ? (
                  <optgroup label="Receitas">
                    {incomes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ) : categoryModalityFilter === 'expense_professional' ? (
                  <optgroup label="💼 Despesas Profissionais (Videomaker / Negócio)">
                    {professionalExpenses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ) : categoryModalityFilter === 'expense_personal' ? (
                  <optgroup label="🏠 Despesas Pessoais">
                    {personalExpenses.map((c) => (
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

          {/* Payment Method & Account/Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="pix">Pix</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="bank_slip">Boleto Bancário</option>
                <option value="cash">Dinheiro em Espécie</option>
                <option value="transfer">Transferência / TED</option>
              </select>
            </div>

            {paymentMethod === 'credit_card' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <CardIcon className="w-3.5 h-3.5 text-slate-400" />
                  Cartão
                </label>
                <select
                  value={creditCardId}
                  onChange={(e) => setCreditCardId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
                >
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} (Fecha dia {card.closingDay})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  Conta Bancária
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.institution})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Client & Project (Videomaker / Professional Workflow) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Cliente (Opcional)
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="">Nenhum cliente</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Projeto (Opcional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="">Nenhum projeto</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.totalValue)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Status do Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`p-3 rounded-2xl border text-sm font-medium transition ${
                  status === 'completed'
                    ? type === 'income'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'income' ? '✓ Recebido' : '✓ Pago'}
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`p-3 rounded-2xl border text-sm font-medium transition ${
                  status === 'pending'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                ⏳ {type === 'income' ? 'A Receber' : 'A Pagar'}
              </button>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Detalhes adicionais, número de nota fiscal, link de entrega..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm resize-none"
            />
          </div>

          {/* Recurrence Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="txRecurring" className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                <Repeat className="w-4 h-4 text-blue-400" />
                <span>Repetir este lançamento (Recorrência)</span>
              </label>
              <input
                type="checkbox"
                id="txRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 accent-blue-500 cursor-pointer"
              />
            </div>

            {isRecurring && (
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-3 animate-fade-in">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Periodicidade
                  </label>
                  <select
                    value={recurrencePeriodicity}
                    onChange={(e) => setRecurrencePeriodicity(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="monthly">Mensal (Todo mês)</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={recurrenceDueDay}
                    onChange={(e) => setRecurrenceDueDay(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white outline-none font-bold"
                  />
                </div>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white shadow-xl transition-all duration-200 active:scale-[0.99] text-base ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
              }`}
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
