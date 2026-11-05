import React from 'react';
import { X, Bell, AlertTriangle, Info, CheckCircle2, CheckCheck } from 'lucide-react';
import { InAppNotification } from '../../types';
import { formatDate } from '../../lib/formatters';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateTab,
}: NotificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-20 p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Central de Alertas</h2>
              <p className="text-[11px] text-slate-400">Vencimentos, recebimentos e metas</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                title="Marcar todas como lidas"
                className="p-1.5 text-xs text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-800 transition flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Ler todas</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-700" />
              Nenhum alerta pendente no momento.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) onMarkAsRead(notif.id);
                  if (notif.linkTab && onNavigateTab) {
                    onNavigateTab(notif.linkTab);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  notif.read
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                    : 'bg-slate-950/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-400'
                      : notif.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-sky-500/20 text-sky-400'
                  }`}
                >
                  {notif.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {notif.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {notif.type === 'info' && <Info className="w-3.5 h-3.5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                    <span className="text-[10px] text-slate-500 shrink-0">{formatDate(notif.date)}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{notif.message}</p>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
