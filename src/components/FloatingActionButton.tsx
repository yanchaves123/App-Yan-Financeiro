import React from 'react';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Sparkles, X, Plus } from 'lucide-react';

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewIncome: () => void;
  onNewExpense: () => void;
  onNewTransfer: () => void;
  onNewWithAI: () => void;
}

export function FloatingActionMenu({
  isOpen,
  onClose,
  onNewIncome,
  onNewExpense,
  onNewTransfer,
  onNewWithAI,
}: QuickActionMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 mb-16 sm:mb-0 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ações Rápidas
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Action */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onNewWithAI();
          }}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-indigo-500/20 hover:from-emerald-500/30 hover:to-indigo-500/30 border border-emerald-500/30 text-left transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                Adicionar com IA
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                  Texto
                </span>
              </h4>
              <p className="text-xs text-slate-400">Ex: "Recebi 1500 da prefeitura pelo vídeo"</p>
            </div>
          </div>
        </button>

        {/* New Income */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onNewIncome();
          }}
          className="w-full p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Nova Receita</h4>
            <p className="text-xs text-slate-400">Entrada de dinheiro ou recebimento de cliente</p>
          </div>
        </button>

        {/* New Expense */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onNewExpense();
          }}
          className="w-full p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Nova Despesa</h4>
            <p className="text-xs text-slate-400">Gastos pessoais, equipamentos ou software</p>
          </div>
        </button>

        {/* New Transfer */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onNewTransfer();
          }}
          className="w-full p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Nova Transferência</h4>
            <p className="text-xs text-slate-400">Movimentação entre contas bancárias</p>
          </div>
        </button>
      </div>
    </div>
  );
}
