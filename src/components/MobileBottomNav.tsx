import React from 'react';
import { LayoutDashboard, ReceiptText, Briefcase, BarChart3, Menu, Plus } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickMenu: () => void;
  onOpenMoreDrawer: () => void;
}

export function MobileBottomNav({
  activeTab,
  onSelectTab,
  onOpenQuickMenu,
  onOpenMoreDrawer,
}: MobileBottomNavProps) {
  const isMoreActive = [
    'accounts',
    'cards',
    'clients',
    'payables',
    'receivables',
    'goals',
    'reserve',
    'recurring',
    'categories',
    'settings',
  ].includes(activeTab);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 px-2 pb-safe-offset">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto relative">
        {/* 1. Início */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* 2. Lançamentos */}
        <button
          type="button"
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeTab === 'transactions' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ReceiptText className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Lançamentos</span>
        </button>

        {/* 3. Central Floating Action Button (+) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={onOpenQuickMenu}
            aria-label="Novo Lançamento"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30 flex items-center justify-center active:scale-95 transition"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* 4. Projetos */}
        <button
          type="button"
          onClick={() => onSelectTab('projects')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeTab === 'projects' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Projetos</span>
        </button>

        {/* 5. Relatórios */}
        <button
          type="button"
          onClick={() => onSelectTab('reports')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            activeTab === 'reports' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Relatórios</span>
        </button>

        {/* 6. Mais drawer trigger */}
        <button
          type="button"
          onClick={onOpenMoreDrawer}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition ${
            isMoreActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-[10px] tracking-tight">Mais</span>
        </button>
      </div>
    </div>
  );
}
