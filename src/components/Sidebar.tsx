import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  CalendarClock,
  Coins,
  Wallet,
  CreditCard,
  Briefcase,
  Users,
  BarChart3,
  Target,
  ShieldCheck,
  Repeat,
  Tag,
  Settings,
  Sparkles,
  LogOut,
  Flame,
  CheckCircle,
} from 'lucide-react';
import { User } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'payables'
  | 'receivables'
  | 'accounts'
  | 'cards'
  | 'projects'
  | 'clients'
  | 'reports'
  | 'goals'
  | 'reserve'
  | 'recurring'
  | 'categories'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  user: User | null;
  onLogout: () => void;
  hasDemoData: boolean;
  onToggleDemoData: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  user,
  onLogout,
  hasDemoData,
  onToggleDemoData,
}: SidebarProps) {
  const menuItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Início', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Lançamentos', icon: <ReceiptText className="w-4 h-4" /> },
    { id: 'payables', label: 'Contas a Pagar', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'receivables', label: 'Contas a Receber', icon: <Coins className="w-4 h-4" /> },
    { id: 'accounts', label: 'Minhas Contas', icon: <Wallet className="w-4 h-4" /> },
    { id: 'cards', label: 'Cartões de Crédito', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'projects', label: 'Projetos', icon: <Briefcase className="w-4 h-4" />, badge: 'Pro' },
    { id: 'clients', label: 'Clientes', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'Relatórios', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'goals', label: 'Metas', icon: <Target className="w-4 h-4" /> },
    { id: 'reserve', label: 'Reserva Financeira', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'recurring', label: 'Recorrências', icon: <Repeat className="w-4 h-4" /> },
    { id: 'categories', label: 'Categorias', icon: <Tag className="w-4 h-4" /> },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/95 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 font-black text-xl ring-1 ring-white/10 select-none">
            Y
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight flex items-center gap-1.5 text-white">
              <span>Yan</span>
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Financeiro
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Gestão Pessoal & Produção</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-teal-400 border border-teal-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo Data Management Card */}
      <div className="p-4 mx-3 mb-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Dados Exemplo
          </span>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
              hasDemoData ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {hasDemoData ? 'Ativo' : 'Vazio'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mb-2.5">
          {hasDemoData
            ? 'Demonstração de videomaker ativa. Pode ser removida com 1 clique.'
            : 'Preencher com dados de exemplo para testar todos os gráficos.'}
        </p>
        <button
          type="button"
          onClick={onToggleDemoData}
          className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold transition border ${
            hasDemoData
              ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {hasDemoData ? 'Remover Demonstração' : 'Carregar Demonstração'}
        </button>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">{user?.name}</span>
            <span className="text-[10px] text-slate-500 block truncate">{user?.email}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Sair da conta"
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
