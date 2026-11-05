import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { Category, CategoryType } from '../../types';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cat: Partial<Category>) => void;
  categoryToEdit?: Category | null;
  defaultType?: CategoryType;
  userId: string;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSave,
  categoryToEdit,
  defaultType = 'expense_professional',
  userId,
}: CategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>(defaultType);
  const [color, setColor] = useState('#8b5cf6');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color);
    } else {
      setName('');
      const initialType = defaultType || 'expense_professional';
      setType(initialType);
      setColor(
        initialType === 'expense_professional'
          ? '#8b5cf6'
          : initialType === 'income'
          ? '#10b981'
          : '#f97316'
      );
    }
  }, [categoryToEdit, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Informe o nome da categoria.');
      return;
    }

    const categoryId = categoryToEdit?.id || `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    onSave({
      id: categoryId,
      userId,
      name: name.trim(),
      type,
      color,
      icon: 'Tag',
      isDefault: categoryToEdit?.isDefault ?? false,
    });
    onClose();
  };

  const presetColors = ['#8b5cf6', '#10b981', '#059669', '#3b82f6', '#ec4899', '#f97316', '#e11d48', '#f59e0b', '#06b6d4', '#64748b'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <p className="text-xs text-slate-400">Classificação para receitas e despesas</p>
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
              Nome da Categoria
            </label>
            <input
              type="text"
              placeholder="ex: Equipamentos de Áudio, Drone, Software..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-purple-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Modalidade / Tipo da Categoria
              </label>
              <span className="text-[10px] text-slate-400">Clique para alternar</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('expense_professional');
                  if (!categoryToEdit) setColor('#8b5cf6');
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  type === 'expense_professional'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200 ring-2 ring-purple-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-lg">💼</span>
                <span>Profissional</span>
                <span className="text-[9px] text-slate-400 font-normal">Videomaker</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('expense_personal');
                  if (!categoryToEdit) setColor('#f97316');
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  type === 'expense_personal'
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200 ring-2 ring-amber-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-lg">🏠</span>
                <span>Pessoal</span>
                <span className="text-[9px] text-slate-400 font-normal">Moradia/Vida</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('income');
                  if (!categoryToEdit) setColor('#10b981');
                }}
                className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span className="text-lg">💰</span>
                <span>Receita</span>
                <span className="text-[9px] text-slate-400 font-normal">Entradas</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Cor
            </label>
            <div className="flex flex-wrap gap-2.5 items-center">
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
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Salvar Categoria
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
