import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Bell, Sparkles, Sun, Moon, Plus, Cloud, RefreshCw } from 'lucide-react';
import { User, InAppNotification } from '../types';
import { formatMonthYear, getMonthName } from '../lib/formatters';
import { subscribeToSyncState, SyncState } from '../lib/firestoreSync';

interface NavbarProps {
  user: User | null;
  currentYearMonth: string;
  onChangeMonth: (yearMonth: string) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  notifications: InAppNotification[];
  onOpenQuickAdd: () => void;
  onOpenAIModal: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Navbar({
  user,
  currentYearMonth,
  onChangeMonth,
  onOpenSearch,
  onOpenNotifications,
  notifications,
  onOpenQuickAdd,
  onOpenAIModal,
  isDarkMode,
  onToggleDarkMode,
}: NavbarProps) {
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [syncState, setSyncState] = useState<SyncState>('connecting');

  useEffect(() => {
    const unsub = subscribeToSyncState((state) => {
      setSyncState(state);
    });
    return () => unsub();
  }, []);

  const handlePrevMonth = () => {
    const [yStr, mStr] = currentYearMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    onChangeMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = currentYearMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    onChangeMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Usuário';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Greeting & Current Month Controls */}
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Olá, <strong className="text-white font-semibold">{firstName}</strong> 👋
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-sm font-bold text-white tracking-tight cursor-default whitespace-nowrap">
                {formatMonthYear(currentYearMonth)}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Center: Search trigger on desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 rounded-2xl py-2 px-3.5 text-xs text-slate-400 flex items-center justify-between transition group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
              <span>Buscar lançamentos, clientes, projetos...</span>
            </div>
            <kbd className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded-md border border-slate-700">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Real-time Cloud Sync Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition ${
              syncState === 'synced'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : syncState === 'syncing'
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                : syncState === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
            title="Sincronização em tempo real entre celular (Safari) e computador via Firebase"
          >
            {syncState === 'synced' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Nuvem Sincronizada</span>
                <span className="sm:hidden">Nuvem</span>
              </>
            ) : syncState === 'syncing' ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Sincronizando...</span>
              </>
            ) : syncState === 'error' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="hidden sm:inline">Erro Conexão</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="hidden sm:inline">Conectando...</span>
              </>
            )}
          </div>

          {/* Quick AI text entry button */}
          <button
            type="button"
            onClick={onOpenAIModal}
            title="Lançamento Rápido com IA"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Adicionar com IA</span>
          </button>

          {/* Search button on mobile */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Pesquisar"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications Center */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Central de Alertas"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
