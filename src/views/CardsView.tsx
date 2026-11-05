import React from 'react';
import { addMonths, dateInMonth } from '../lib/finance';
import { formatMonthYear } from '../lib/formatters';
import {
  CreditCard as CardIcon,
  Plus,
  ShoppingBag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Account, CreditCard, Transaction } from '../types';
import { calculateCreditCardInvoice } from '../lib/calculations';
import { formatCurrency, formatDate } from '../lib/formatters';

interface CardsViewProps {
  creditCards: CreditCard[];
  transactions: Transaction[];
  currentYearMonth: string;
  onOpenNewCard: () => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenInstallmentPurchase: () => void;
  onPayInvoice: (card: CreditCard, invoiceAmount: number) => void;
  onQuickAddPresetCard?: (preset: Partial<CreditCard>) => void;
}

export function CardsView({
  creditCards,
  transactions,
  currentYearMonth,
  onOpenNewCard,
  onEditCard,
  onDeleteCard,
  onOpenInstallmentPurchase,
  onPayInvoice,
  onQuickAddPresetCard,
}: CardsViewProps) {
  const [selectedCardId, setSelectedCardId] = React.useState<string>('all');

  // Check presence of requested cards
  const hasInter = creditCards.some(
    (c) => c.institution.toLowerCase().includes('inter') || c.name.toLowerCase().includes('inter')
  );
  const hasMercadoPago = creditCards.some(
    (c) => c.institution.toLowerCase().includes('mercado') || c.name.toLowerCase().includes('mercado')
  );

  // Find active installments
  const installmentPurchases = transactions.filter(
    (t) => t.paymentMethod === 'credit_card' && t.installmentTotal && t.installmentTotal > 1
  );

  // Filtered card transactions
  const cardTransactions = transactions.filter((t) => {
    if (t.paymentMethod !== 'credit_card') return false;
    if (selectedCardId === 'all') return true;
    return t.creditCardId === selectedCardId;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-purple-400" />
            Cartões de Crédito & Faturas
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe limites, faturas atuais, parcelamentos e vencimentos
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={onOpenInstallmentPurchase}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Compra Parcelada</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewCard}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {/* Suggestion banner if Inter or Mercado Pago are missing */}
      {(!hasInter || !hasMercadoPago) && onQuickAddPresetCard && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div>
            <span className="text-xs font-bold text-white block">Adicione seus cartões digitais com 1 clique</span>
            <span className="text-[11px] text-slate-400 block">Configure limites e vencimentos do Banco Inter e Mercado Pago</span>
          </div>
          <div className="flex items-center gap-2">
            {!hasInter && (
              <button
                type="button"
                onClick={() =>
                  onQuickAddPresetCard({
                    name: 'Inter Mastercard Black',
                    institution: 'Banco Inter',
                    limit: 6000,
                    closingDay: 10,
                    dueDay: 17,
                    color: '#ff7a00',
                  })
                }
                className="py-1.5 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Banco Inter
              </button>
            )}
            {!hasMercadoPago && (
              <button
                type="button"
                onClick={() =>
                  onQuickAddPresetCard({
                    name: 'Mercado Pago Visa',
                    institution: 'Mercado Pago',
                    limit: 4500,
                    closingDay: 3,
                    dueDay: 10,
                    color: '#009ee3',
                  })
                }
                className="py-1.5 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Mercado Pago
              </button>
            )}
          </div>
        </div>
      )}

      {/* Credit Cards Visual Mockups Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {creditCards.map((card) => {
          const invoiceInfo = calculateCreditCardInvoice(card, transactions, currentYearMonth);
          const limitPercentage = card.limit > 0 ? (invoiceInfo.totalUsedLimit / card.limit) * 100 : 0;
          const isOverLimit = invoiceInfo.totalUsedLimit > card.limit;

          return (
            <div
              key={card.id}
              className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5"
            >
              {/* Virtual Card Graphic */}
              <div
                className="p-5 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-44"
                style={{ backgroundColor: card.color }}
              >
                {/* Visual chip and institution */}
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-7 rounded-md bg-amber-300/80 border border-amber-200/50 shadow-inner flex items-center justify-center">
                      <div className="w-6 h-4 border border-amber-600/40 rounded-sm" />
                    </div>
                    <span className="text-xs font-mono tracking-widest uppercase opacity-80">
                      Yan Financeiro
                    </span>
                  </div>
                  <span className="font-extrabold text-sm tracking-wide uppercase">{card.institution}</span>
                </div>

                {/* Card Name */}
                <div className="relative z-10">
                  <span className="text-lg font-bold block tracking-wide">{card.name}</span>
                  <div className="flex items-center gap-4 text-xs opacity-80 mt-1">
                    <span>Fecha dia {card.closingDay}</span>
                    <span>Vence dia {card.dueDay}</span>
                  </div>
                </div>

                {/* Card Background Accent Circle */}
                <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
              </div>

              {/* Limit Bar (Used vs Available) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold">Limite Utilizado:</span>
                  <span className="text-white font-bold">
                    {formatCurrency(invoiceInfo.totalUsedLimit)} de {formatCurrency(card.limit)}
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      limitPercentage > 85 ? 'bg-rose-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, limitPercentage)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">
                    Disponível: <strong className="text-emerald-400 font-bold">{formatCurrency(invoiceInfo.availableLimit)}</strong>
                  </span>
                  <span className="text-slate-400">
                    {limitPercentage.toFixed(0)}% ocupado
                  </span>
                </div>
              </div>

              {/* Current and Next Invoices Info */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Fatura Atual ({formatMonthYear(currentYearMonth)})
                  </span>
                  <span className="text-base font-extrabold text-white block">
                    {formatCurrency(invoiceInfo.currentInvoice)}
                  </span>
                  <span className="text-[10px] text-amber-400 block mt-0.5">
                    Vencimento: {formatDate(dateInMonth(currentYearMonth, card.dueDay))}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                    Próxima Fatura ({formatMonthYear(addMonths(`${currentYearMonth}-01`, 1).slice(0, 7))})
                  </span>
                  <span className="text-base font-extrabold text-slate-300 block">
                    {formatCurrency(invoiceInfo.nextInvoice)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Vencimento: {formatDate(dateInMonth(addMonths(`${currentYearMonth}-01`, 1).slice(0, 7), card.dueDay))}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Pay Invoice & Edit Card */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEditCard(card)}
                    title="Editar cartão"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {creditCards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCard(card.id)}
                      title="Excluir cartão"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {invoiceInfo.currentInvoice > 0 ? (
                  <button
                    type="button"
                    onClick={() => onPayInvoice(card, invoiceInfo.currentInvoice)}
                    className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Pagar Fatura
                  </button>
                ) : (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Fatura em dia
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Installments Section */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              Compras Parceladas Ativas
            </h3>
            <p className="text-xs text-slate-400">
              Parcelas programadas que aparecem automaticamente em cada mês
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenInstallmentPurchase}
            className="text-xs text-purple-400 font-semibold hover:underline"
          >
            + Nova compra
          </button>
        </div>

        {installmentPurchases.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhuma compra parcelada registrada no cartão.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {installmentPurchases.map((inst) => (
              <div
                key={inst.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block">{inst.description}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Data: {formatDate(inst.date)} • Parcela {inst.installmentCurrent} de {inst.installmentTotal}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-white block">
                    {formatCurrency(inst.amount)}
                  </span>
                  <span className="text-[10px] text-purple-400 font-semibold uppercase">
                    Cartão
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card Expenses History with Card Filter */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CardIcon className="w-4 h-4 text-purple-400" />
              Lançamentos nos Cartões de Crédito
            </h3>
            <p className="text-xs text-slate-400">
              Despesas e compras debitadas na fatura de cada cartão
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCardId('all')}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                selectedCardId === 'all'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            {creditCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedCardId === card.id
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: card.color }}
                />
                {card.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {cardTransactions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Nenhuma despesa de cartão de crédito encontrada no filtro selecionado.
          </div>
        ) : (
          <div className="space-y-2">
            {cardTransactions.slice(0, 10).map((tx) => {
              const card = creditCards.find((c) => c.id === tx.creditCardId);
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
                      style={{ backgroundColor: card?.color || '#820ad1' }}
                    >
                      <CardIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white block truncate">{tx.description}</span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{formatDate(tx.date)}</span>
                        <span>•</span>
                        <span className="font-semibold" style={{ color: card?.color || '#a855f7' }}>
                          {card?.name || 'Cartão'}
                        </span>
                        {tx.installmentTotal && tx.installmentTotal > 1 && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400">
                              Parcela {tx.installmentCurrent}/{tx.installmentTotal}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-white block">
                      - {formatCurrency(tx.amount)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        tx.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {tx.status === 'completed' ? 'Faturado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
