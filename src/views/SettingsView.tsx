import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Moon,
  Sun,
  Database,
  Download,
  Upload,
  Sparkles,
  Trash2,
  Check,
  Shield,
  HelpCircle,
  Bell,
  Clock,
  Volume2,
  Smartphone,
  Plus,
  X as CloseIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ReminderSettings, User as UserType } from '../types';
import { StorageService } from '../lib/storage';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  sendTestNotification,
  isIOSDevice,
  isStandaloneApp,
} from '../lib/notifications';

interface SettingsViewProps {
  user: UserType | null;
  onUpdateUser: (updated: Partial<UserType>) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  hasDemoData: boolean;
  onToggleDemoData: () => void;
  onResetAllData: () => void;
  onOpenIOSGuide?: () => void;
}

export function SettingsView({
  user,
  onUpdateUser,
  isDarkMode,
  onToggleDarkMode,
  hasDemoData,
  onToggleDemoData,
  onResetAllData,
  onOpenIOSGuide,
}: SettingsViewProps) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Notification settings state
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() =>
    StorageService.getReminderSettings()
  );
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [newTimeInput, setNewTimeInput] = useState('');
  const [testNotificationFeedback, setTestNotificationFeedback] = useState<string | null>(null);

  const isIOS = isIOSDevice();
  const isStandalone = isStandaloneApp();

  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus());
  }, []);

  const handleToggleReminders = () => {
    const updated: ReminderSettings = {
      ...reminderSettings,
      enabled: !reminderSettings.enabled,
    };
    setReminderSettings(updated);
    StorageService.saveReminderSettings(updated);
  };

  const handleToggleSound = () => {
    const updated: ReminderSettings = {
      ...reminderSettings,
      soundEnabled: !reminderSettings.soundEnabled,
    };
    setReminderSettings(updated);
    StorageService.saveReminderSettings(updated);
  };

  const handleToggleVibrate = () => {
    const updated: ReminderSettings = {
      ...reminderSettings,
      vibrateEnabled: !reminderSettings.vibrateEnabled,
    };
    setReminderSettings(updated);
    StorageService.saveReminderSettings(updated);
  };

  const handleAddTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTimeInput) return;
    if (reminderSettings.times.includes(newTimeInput)) {
      setNewTimeInput('');
      return;
    }
    const updatedTimes = [...reminderSettings.times, newTimeInput].sort();
    const updated: ReminderSettings = {
      ...reminderSettings,
      times: updatedTimes,
    };
    setReminderSettings(updated);
    StorageService.saveReminderSettings(updated);
    setNewTimeInput('');
  };

  const handleRemoveTime = (timeToRemove: string) => {
    const updatedTimes = reminderSettings.times.filter((t) => t !== timeToRemove);
    const updated: ReminderSettings = {
      ...reminderSettings,
      times: updatedTimes,
    };
    setReminderSettings(updated);
    StorageService.saveReminderSettings(updated);
  };

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      setTestNotificationFeedback('Permissão concedida! Suas notificações estão ativas.');
      setTimeout(() => setTestNotificationFeedback(null), 4000);
    } else if (perm === 'denied') {
      setTestNotificationFeedback('Permissão negada no navegador. Habilite nas configurações do Safari.');
      setTimeout(() => setTestNotificationFeedback(null), 5000);
    }
  };

  const handleTestNotification = async () => {
    if (!user) return;
    setTestNotificationFeedback('Enviando lembrete de teste com áudio...');
    const result = await sendTestNotification(user.id);
    setPermissionStatus(getNotificationPermissionStatus());
    if (result.mode === 'denied') {
      setTestNotificationFeedback('Notificações bloqueadas no navegador. Confira as permissões do site.');
    } else {
      setTestNotificationFeedback(result.mode === 'system' ? '🔔 Notificação enviada ao navegador.' : 'Aviso salvo dentro do app. A notificação do sistema não foi enviada.');
    }
    setTimeout(() => setTestNotificationFeedback(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      name,
      email,
      profession,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleBackupDownload = () => {
    const backup: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('fp_')) {
        backup[key] = localStorage.getItem(key);
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financeiro_pro_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setBackupMessage('Backup baixado com sucesso!');
    setTimeout(() => setBackupMessage(null), 3500);
  };

  const handleBackupRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await StorageService.restoreBackup(data);
        setBackupMessage('Backup mesclado com a sua conta na nuvem. Atualizando sistema...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        setBackupMessage(err instanceof Error ? err.message : 'Não foi possível restaurar o backup.');
        setTimeout(() => setBackupMessage(null), 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-400" />
          Configurações da Plataforma
        </h2>
        <p className="text-xs text-slate-400">
          Personalize seu perfil profissional, preferências visuais, lembretes de lançamentos e backup
        </p>
      </div>

      {/* Lembretes e Notificações no Celular (Safari & PWA) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Lembretes & Notificações no Celular
                {reminderSettings.enabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    Ativo
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Avisos automáticos para lembrar você de registrar receitas e despesas
              </p>
            </div>
          </div>

          {/* Toggle Reminders Master */}
          <button
            type="button"
            onClick={handleToggleReminders}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
              reminderSettings.enabled ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white transition-transform transform ${
                reminderSettings.enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Permission & iOS Status Bar */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Permissão do Navegador:</span>
              {permissionStatus === 'granted' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Autorizada
                </span>
              ) : permissionStatus === 'denied' ? (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Bloqueada no navegador
                </span>
              ) : (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Pendente de Ativação
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {permissionStatus !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
                >
                  Autorizar Notificações
                </button>
              )}
              {isIOS && onOpenIOSGuide && (
                <button
                  type="button"
                  onClick={onOpenIOSGuide}
                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3 text-sky-400" />
                  Instruções Safari iPhone
                </button>
              )}
            </div>
          </div>

          {/* iOS Safari Tip */}
          {isIOS && !isStandalone && (
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300 flex items-start gap-2">
              <Smartphone className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <strong>Dica Safari iPhone:</strong> No iOS, adicione à <strong>Tela de Início</strong> (toque no botão Compartilhar ⎋ e depois em <em>"Adicionar à Tela de Início"</em>) para abrir o app como aplicativo. Os lembretes desta versão exigem o app aberto.
              </div>
            </div>
          )}
        </div>

        {/* Scheduled Times */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Horários Diários de Notificação
            </label>
            <span className="text-[11px] text-slate-500">
              {reminderSettings.times.length} horários configurados
            </span>
          </div>

          {/* Time chips list */}
          <div className="flex flex-wrap gap-2.5">
            {reminderSettings.times.map((t) => (
              <div
                key={t}
                className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold group hover:border-emerald-500/50 transition"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {t === '08:00' ? '(Manhã)' : t === '12:00' ? '(Almoço)' : t === '20:00' ? '(Noite)' : ''}
                </span>
                {reminderSettings.times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTime(t)}
                    title="Remover horário"
                    className="text-slate-500 hover:text-rose-400 transition ml-1"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Form to add another custom time */}
          <form onSubmit={handleAddTime} className="flex items-center gap-2 pt-1">
            <input
              type="time"
              value={newTimeInput}
              onChange={(e) => setNewTimeInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!newTimeInput}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold text-xs transition flex items-center gap-1 border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Horário
            </button>
          </form>
        </div>

        {/* Audio & Vibration Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">Sinal Sonoro</span>
                <span className="text-[10px] text-slate-400">Chime sonoro ao notificar</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${
                reminderSettings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform transform ${
                  reminderSettings.soundEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-white block">Vibração Háptica</span>
                <span className="text-[10px] text-slate-400">Vibrar celular ao alertar</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleVibrate}
              className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${
                reminderSettings.vibrateEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform transform ${
                  reminderSettings.vibrateEnabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Test Button & Feedback */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleTestNotification}
            className="py-2 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Disparar Notificação de Teste no Celular</span>
          </button>

          {testNotificationFeedback && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              {testNotificationFeedback}
            </span>
          )}
        </div>
      </div>

      {/* User Profile Form */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          Perfil do Usuário
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white text-sm outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white text-sm outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Atividade Profissional
            </label>
            <input
              type="text"
              placeholder="ex: Videomaker, Editor de Vídeo, Produtor Audiovisual"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white text-sm outline-none transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
            >
              Salvar Alterações
            </button>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" /> Perfil atualizado!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Visual & Regional Preferences */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Preferências Regionais & Visuais</h3>

        <div className="divide-y divide-slate-800/80 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Tema da Interface</span>
              <span className="text-slate-400">Alternar entre modo escuro e modo claro</span>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition flex items-center gap-2"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{isDarkMode ? 'Modo Escuro Ativo' : 'Modo Claro'}</span>
            </button>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Moeda Padrão</span>
              <span className="text-slate-400">Padrão monetário brasileiro</span>
            </div>
            <span className="font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              Real Brasileiro (R$ BRL)
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-bold text-white block">Formato de Data</span>
              <span className="text-slate-400">Calendário nacional</span>
            </div>
            <span className="font-mono font-bold text-slate-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              DD/MM/AAAA
            </span>
          </div>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Ambiente de Demonstração</h3>
              <p className="text-xs text-slate-400">
                Preenche o sistema com trabalhos, clientes e despesas típicas de videomaker
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleDemoData}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition border ${
              hasDemoData
                ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
            }`}
          >
            {hasDemoData ? 'Limpar Dados de Exemplo' : 'Carregar Dados de Exemplo'}
          </button>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          Backup & Segurança dos Dados
        </h3>
        <p className="text-xs text-slate-400">
          Seus dados são mantidos neste navegador e sincronizados com sua conta na nuvem quando há conexão. Confira o status de sincronização e baixe um backup completo sempre que precisar.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={handleBackupDownload}
            className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Baixar Backup Completo (JSON)</span>
          </button>

          <label className="py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Restaurar Backup (mesclar)</span>
            <input type="file" accept=".json" onChange={handleBackupRestore} className="hidden" />
          </label>
        </div>

        {backupMessage && (
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            {backupMessage}
          </div>
        )}

        <div className="pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onResetAllData}
            className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold text-xs transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zerar lançamentos e saldos
          </button>
        </div>
      </div>
    </div>
  );
}
