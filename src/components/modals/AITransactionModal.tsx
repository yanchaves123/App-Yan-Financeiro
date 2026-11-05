import React, { useState } from 'react';
import { X, Sparkles, Check, Edit3, ArrowRight, Loader2, Info } from 'lucide-react';
import { Account, Category, Client, CreditCard, Project, Transaction } from '../../types';
import { parseTransactionFromText, ParsedTransactionResult } from '../../lib/nlp';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface AITransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: (tx: Partial<Transaction>) => void | boolean;
  onEditInForm: (tx: Partial<Transaction>) => void;
  categories: Category[];
  accounts: Account[];
  creditCards: CreditCard[];
  clients: Client[];
  projects: Project[];
}

export function AITransactionModal({
  isOpen,
  onClose,
  onConfirmSave,
  onEditInForm,
  categories,
  accounts,
  creditCards,
  clients,
  projects,
}: AITransactionModalProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedTransactionResult | null>(null);

  if (!isOpen) return null;

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const result = await parseTransactionFromText(
        inputText,
        categories,
        accounts,
        clients,
        projects
      );
      setParsedResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResult) return;
    const saved = onConfirmSave({
      type: parsedResult.type,
      description: parsedResult.description,
      amount: parsedResult.amount,
      date: parsedResult.date,
      categoryId: parsedResult.categoryId,
      accountId: parsedResult.accountId,
      paymentMethod: parsedResult.paymentMethod,
      creditCardId: parsedResult.creditCardId,
      status: parsedResult.status,
      clientId: parsedResult.clientId,
      projectId: parsedResult.projectId,
      observations: parsedResult.observations,
    });
    if (saved !== false) onClose();
  };

  const handleEdit = () => {
    if (!parsedResult) return;
    onEditInForm({
      type: parsedResult.type,
      description: parsedResult.description,
      amount: parsedResult.amount,
      date: parsedResult.date,
      categoryId: parsedResult.categoryId,
      accountId: parsedResult.accountId,
      paymentMethod: parsedResult.paymentMethod,
      creditCardId: parsedResult.creditCardId,
      status: parsedResult.status,
      clientId: parsedResult.clientId,
      projectId: parsedResult.projectId,
      observations: parsedResult.observations,
    });
    onClose();
  };

  const quickExamples = [
    'Recebi 1500 reais da prefeitura pelo vídeo da festa do peão',
    'Paguei 350 reais de gasolina no cartão',
    'Assinatura Adobe 289 reais no cartão de crédito',
    'Recebi 2400 da academia pelo pacote de vídeos no Pix',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Adicionar com Inteligência
              </h2>
              <p className="text-xs text-slate-400">Escreva em linguagem natural e a IA organiza</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!parsedResult ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  O que você quer registrar?
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Recebi 1500 reais da prefeitura pelo vídeo da festa do peão..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  autoFocus
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl p-3.5 text-white placeholder-slate-600 outline-none transition text-sm resize-none"
                />
              </div>

              {/* Quick suggestions */}
              <div>
                <span className="text-xs text-slate-500 font-medium block mb-2">Exemplos rápidos:</span>
                <div className="space-y-1.5">
                  {quickExamples.map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInputText(ex)}
                      className="w-full text-left text-xs p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800 border border-slate-800/80 text-slate-300 transition flex items-center justify-between group"
                    >
                      <span className="truncate">{ex}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-emerald-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={loading || !inputText.trim()}
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-600/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analisando lançamento...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Identificar Lançamento
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Identified Result Confirmation Card */
            <div className="space-y-4 animate-scale-up">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  Identificamos este lançamento:
                </span>
                <button
                  type="button"
                  onClick={() => setParsedResult(null)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Tentar outro texto
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${
                        parsedResult.type === 'income'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {parsedResult.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5">
                      {parsedResult.description}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-white">
                      {formatCurrency(parsedResult.amount)}
                    </span>
                    <span className="block text-xs text-slate-400">{formatDate(parsedResult.date)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block">Categoria:</span>
                    <span className="text-slate-200 font-medium">
                      {categories.find((c) => c.id === parsedResult.categoryId)?.name || 'Geral'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Forma:</span>
                    <span className="text-slate-200 font-medium uppercase">{parsedResult.paymentMethod}</span>
                  </div>
                  {parsedResult.clientName && (
                    <div>
                      <span className="text-slate-500 block">Cliente:</span>
                      <span className="text-slate-200 font-medium">{parsedResult.clientName}</span>
                    </div>
                  )}
                  {parsedResult.projectName && (
                    <div>
                      <span className="text-slate-500 block">Projeto:</span>
                      <span className="text-slate-200 font-medium">{parsedResult.projectName}</span>
                    </div>
                  )}
                </div>

                {parsedResult.paymentMethod === 'credit_card' && (
                  <label className="block text-sm text-slate-300">Cartão utilizado
                    <select aria-label="Cartão utilizado" className="w-full bg-slate-950 p-3 rounded-xl mt-2" value={parsedResult.creditCardId || ''}
                      onChange={e => setParsedResult({ ...parsedResult, creditCardId: e.target.value })}>
                      <option value="">Selecione o cartão</option>
                      {creditCards.map(card => <option key={card.id} value={card.id}>{card.name}</option>)}
                    </select>
                    <span className="text-xs">A compra entrará no mês seguinte, no vencimento do cartão.</span>
                  </label>
                )}
                {parsedResult.confidenceSource === 'ai' ? (
                  <p className="text-[11px] text-emerald-400/80 flex items-center gap-1 pt-1">
                    <Sparkles className="w-3 h-3" />
                    Processado com modelo Gemini 3.8 Flash
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                    <Info className="w-3 h-3" />
                    Processado com analisador inteligente de português
                  </p>
                )}
              </div>

              {/* Action Buttons: Confirm & Save OR Edit */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="py-3 px-4 rounded-2xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar no Formulário
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="py-3 px-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 text-sm"
                >
                  <Check className="w-4 h-4" />
                  Confirmar e Salvar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
