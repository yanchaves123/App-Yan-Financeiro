import React, { useState, useEffect } from 'react';
import { Bell, ChevronRight, X, Clock, Smartphone, Check } from 'lucide-react';
import { getNotificationPermissionStatus, isIOSDevice, isStandaloneApp, sendTestNotification } from '../lib/notifications';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';

interface ReminderBannerProps {
  onOpenSettings: () => void;
  onOpenIOSGuide: () => void;
  userId: string;
}

export function ReminderBanner({ onOpenSettings, onOpenIOSGuide, userId }: ReminderBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneApp();
  const { showToast } = useToast();

  useEffect(() => {
    setPermission(getNotificationPermissionStatus());
    const dismissedAt = localStorage.getItem('fp_dismiss_reminder_banner');
    if (dismissedAt) {
      // Don't show if dismissed within last 7 days
      const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (days < 7) {
        setIsDismissed(true);
      }
    }
  }, []);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('fp_dismiss_reminder_banner', Date.now().toString());
  };

  const handleQuickTest = async () => {
    const result = await sendTestNotification(userId);
    setPermission(getNotificationPermissionStatus());
    if (result.mode === 'denied') {
      showToast('Notificações bloqueadas no navegador. Ative nas permissões do Safari.', 'error');
    } else {
      showToast('Notificação de lembrete enviada!', 'success');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/50 border border-emerald-500/25 p-3 sm:p-4 text-xs shadow-lg animate-fade-in mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 mt-0.5">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm">
                {StorageService.getReminderSettings().enabled ? 'Lembretes configurados' : 'Lembretes desativados'}
              </span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {StorageService.getReminderSettings().times.join(' • ')}
              </span>
              {isStandalone && (
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  App Instalado
                </span>
              )}
            </div>
            <p className="text-slate-300 text-xs mt-0.5">
              Mantenha o app aberto para receber os lembretes. O envio com o app fechado ainda não está disponível.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isIOS && !isStandalone ? (
            <button
              type="button"
              onClick={onOpenIOSGuide}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Ver Guia Safari</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleQuickTest}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Testar Agora</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition"
          >
            Ajustar
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dispensar aviso"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
