import { StorageService } from './storage';
import { getTodayDateString } from './formatters';

// Web Audio API notification sound generator (crisp, pleasant chime)
export function playNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // First chime tone (E5 ~ 659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.001, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.36);

    // Second chime tone (A5 ~ 880Hz, slightly delayed for harmony)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.001, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.66);
    osc2.onended = () => { void ctx.close(); };
  } catch (err) {
    console.warn('AudioContext playback not allowed yet or not supported', err);
  }
}

// Haptic feedback trigger for mobile
export function triggerHapticFeedback(): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([120, 60, 140]);
    } catch {
      // Ignore vibration error
    }
  }
}

// Platform detection
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission', err);
    return Notification.permission || 'denied';
  }
}

// Display system notification
export async function showSystemNotification(
  title: string,
  options?: NotificationOptions & { url?: string }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const notificationOptions: NotificationOptions & Record<string, unknown> = {
    icon: '/pwa-192x192.png',
    badge: '/apple-touch-icon.png',
    vibrate: [200, 100, 200],
    silent: false,
    ...options,
  };

  // Try via Service Worker Registration first (required for iOS Safari 16.4+ Web Push & background PWA)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    } catch (err) {
      console.warn('Service worker showNotification failed, trying direct Notification', err);
    }
  }

  // Fallback to direct window.Notification
  try {
    const notif = new Notification(title, notificationOptions);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.error('Direct Notification failed', err);
    return false;
  }
}

// Message templates according to time slot
export function getReminderMessageForTime(timeStr: string): { title: string; message: string } {
  const [hourStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);

  if (hour < 11) {
    return {
      title: '☀️ Bom dia! Lançamentos da Manhã',
      message: 'Hora de registrar seus gastos e entradas do início do dia no Yan Financeiro.',
    };
  } else if (hour >= 11 && hour < 16) {
    return {
      title: '🥗 Almoço & Gastos do Meio-Dia',
      message: 'Não deixe acumular: registre agora as despesas do almoço ou pagamentos recebidos!',
    };
  } else {
    return {
      title: '🌙 Fechamento Noturno — Yan Financeiro',
      message: 'Fechamento do dia! Reserve 1 minuto para lançar todas as contas e manter seu saldo em dia.',
    };
  }
}

// Check and trigger scheduled reminders
export async function checkAndTriggerScheduledReminders(
  userId: string,
  onNotify?: (title: string, message: string) => void
): Promise<boolean> {
  const settings = StorageService.getReminderSettings();
  if (!settings.enabled) return false;

  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  const todayStr = getTodayDateString();

  for (const scheduledTime of settings.times) {
    if (currentTime === scheduledTime) {
      // Check if already triggered today for this slot
      const last = settings.lastTriggered?.[scheduledTime];
      if (last === todayStr) {
        continue;
      }

      const { title, message } = getReminderMessageForTime(scheduledTime);

      // Claim before yielding so overlapping interval/focus checks cannot send twice.
      StorageService.recordReminderTriggered(scheduledTime, todayStr);
      StorageService.saveNotification({
        id: `notif_rem_${userId}_${todayStr}_${scheduledTime}`,
        userId, title, message, type: 'info', date: todayStr, read: false, linkTab: 'transactions',
      });

      // 1. System notification
      await showSystemNotification(title, {
        body: message,
        tag: `reminder-${scheduledTime}-${todayStr}`,
      });

      // 2. Audio & Haptics
      if (settings.soundEnabled) {
        playNotificationSound();
      }
      if (settings.vibrateEnabled) {
        triggerHapticFeedback();
      }

      if (onNotify) {
        onNotify(title, message);
      }

      return true;
    }
  }

  return false;
}

// Immediate Test Notification
export async function sendTestNotification(
  userId: string
): Promise<{ success: boolean; mode: 'system' | 'inapp' | 'denied' }> {
  const settings = StorageService.getReminderSettings();
  const title = '🔔 Teste de Notificação — Yan Financeiro';
  const message = 'Teste do Yan Financeiro. Os lembretes funcionam enquanto o app está aberto; com o app fechado, o envio não está disponível nesta versão.';

  if (settings.soundEnabled) {
    playNotificationSound();
  }
  if (settings.vibrateEnabled) {
    triggerHapticFeedback();
  }

  // Always save in-app notification
  StorageService.saveNotification({
    id: `notif_test_${Date.now()}`,
    userId,
    title,
    message,
    type: 'success',
    date: getTodayDateString(),
    read: false,
    linkTab: 'transactions',
  });

  const perm = getNotificationPermissionStatus();
  if (perm === 'granted') {
    const sent = await showSystemNotification(title, {
      body: message,
      tag: 'test-reminder',
    });
    return { success: sent, mode: sent ? 'system' : 'inapp' };
  } else if (perm === 'denied') {
    return { success: false, mode: 'denied' };
  } else {
    // Default: try requesting
    const newPerm = await requestNotificationPermission();
    if (newPerm === 'granted') {
      const sent = await showSystemNotification(title, {
        body: message,
        tag: 'test-reminder',
      });
      return { success: sent, mode: sent ? 'system' : 'inapp' };
    }
    return { success: true, mode: 'inapp' };
  }
}
