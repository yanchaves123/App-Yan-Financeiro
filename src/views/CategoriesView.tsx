import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2 } from 'lucide-react';
import { Category, CategoryType } from '../types';

interface CategoriesViewProps {
  categories: Category[];
  onOpenNewCategory: (defaultType?: CategoryType) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export function CategoriesView({
  categories,
  onOpenNewCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoriesViewProps) {
  const [activeTab, setActiveTab] = useState<CategoryType>('expense_professional');

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const personalCategories = categories.filter((c) => c.type === 'expense_personal');
  const professionalCategories = categories.filter((c) => c.type === 'expense_professional');

  const currentList =
    activeTab === 'expense_professional'
      ? professionalCategories
      : activeTab === 'expense_personal'
      ? personalCategories
      : incomeCategories;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-400" />
            Categorias Financeiras
          </h2>
          <p className="text-xs text-slate-400">
            Organize suas receitas, despesas pessoais e despesas profissionais de videomaker
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenNewCategory(activeTab)}
          className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('expense_professional')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'expense_professional'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Despesas Profissionais ({professionalCategories.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expense_personal')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'expense_personal'
              ? 'bg-rose-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Despesas Pessoais ({personalCategories.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2.5 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'income'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Receitas ({incomeCategories.length})
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {currentList.map((cat) => (
          <div
            key={cat.id}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md flex items-center justify-between hover:border-slate-700 transition"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: cat.color }}
              />
              <div>
                <span className="text-sm font-bold text-white block">{cat.name}</span>
                <span className="text-[10px] text-slate-500 block uppercase">
                  {cat.type === 'expense_professional'
                    ? 'Profissional'
                    : cat.type === 'expense_personal'
                    ? 'Pessoal'
                    : 'Receita'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEditCategory(cat)}
                title="Editar categoria"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteCategory(cat.id)}
                title="Excluir categoria"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
