import React from 'react';
import {
  X,
  CalendarClock,
  Coins,
  Wallet,
  CreditCard,
  Users,
  Target,
  ShieldCheck,
  Repeat,
  Tag,
  Settings,
  FileSpreadsheet,
  Sparkles,
  LogOut,
  Bell,
  Smartphone,
} from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { User } from '../types';

interface MobileMoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenImportExport: () => void;
  user: User | null;
  onLogout: () => void;
  hasDemoData: boolean;
  onToggleDemoData: () => void;
  onOpenIOSGuide?: () => void;
}

export function MobileMoreDrawer({
  isOpen,
  onClose,
  onSelectTab,
  onOpenImportExport,
  user,
  onLogout,
  hasDemoData,
  onToggleDemoData,
  onOpenIOSGuide,
}: MobileMoreDrawerProps) {
  if (!isOpen) return null;

  const items: { id: ActiveTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'payables', label: 'Contas a Pagar', icon: <CalendarClock className="w-5 h-5 text-rose-400" />, desc: 'Vencimentos e compromissos' },
    { id: 'receivables', label: 'Contas a Receber', icon: <Coins className="w-5 h-5 text-emerald-400" />, desc: 'Cobranças e previsões' },
    { id: 'accounts', label: 'Minhas Contas', icon: <Wallet className="w-5 h-5 text-indigo-400" />, desc: 'Saldos bancários e carteiras' },
    { id: 'cards', label: 'Cartões de Crédito', icon: <CreditCard className="w-5 h-5 text-purple-400" />, desc: 'Faturas e parcelas' },
    { id: 'clients', label: 'Clientes', icon: <Users className="w-5 h-5 text-sky-400" />, desc: 'Cadastro e faturamento' },
    { id: 'goals', label: 'Metas', icon: <Target className="w-5 h-5 text-amber-400" />, desc: 'Objetivos e equipamentos' },
    { id: 'reserve', label: 'Reserva Financeira', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />, desc: 'Cálculo de meses de segurança' },
    { id: 'recurring', label: 'Recorrências', icon: <Repeat className="w-5 h-5 text-blue-400" />, desc: 'Assinaturas e contratos mensais' },
    { id: 'categories', label: 'Categorias', icon: <Tag className="w-5 h-5 text-teal-400" />, desc: 'Organização de despesas' },
    { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5 text-slate-400" />, desc: 'Preferências e perfil' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up pb-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{user?.name}</h3>
              <p className="text-[11px] text-slate-400">Mais Módulos e Opções</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lembretes no Celular (08h, 12h, 20h) */}
        <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/60 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Lembretes no Celular</span>
              <span className="text-[11px] text-emerald-400 block font-medium">08:00 • 12:00 • 20:00 (Safari / iOS)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (onOpenIOSGuide) {
                onOpenIOSGuide();
              } else {
                onSelectTab('settings');
              }
              onClose();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Ativar
          </button>
        </div>

        {/* Demo data toggle button on mobile */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">Dados de Demonstração</span>
              <span className="text-[11px] text-slate-400 block">Exemplo com projetos de videomaker</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleDemoData}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              hasDemoData
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {hasDemoData ? 'Remover' : 'Carregar'}
          </button>
        </div>

        {/* Grid of menu options */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onClose();
              }}
              className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 text-left transition flex flex-col justify-between"
            >
              <div className="mb-2">{item.icon}</div>
              <div>
                <span className="text-xs font-bold text-white block">{item.label}</span>
                <span className="text-[10px] text-slate-400 block truncate">{item.desc}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Import/Export & Logout */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => {
              onOpenImportExport();
              onClose();
            }}
            className="w-full p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Importar / Exportar Planilhas (CSV)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
