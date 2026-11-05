import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: ConfirmDeleteModalProps) {
  const [error, setError] = useState('');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center animate-scale-up">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{message}</p>

        {error && <p role="alert" className="text-rose-400 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              try { setError(''); onConfirm(); onClose(); }
              catch (error) { setError((error as Error).message); }
            }}
            className="py-3 px-4 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition text-sm"
          >
            {title === 'Registrar pagamento da fatura' ? 'Registrar pagamento' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
