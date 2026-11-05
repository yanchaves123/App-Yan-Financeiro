import React from 'react';
import { X, Share, PlusSquare, Bell, Smartphone, CheckCircle, Volume2 } from 'lucide-react';
import { sendTestNotification } from '../lib/notifications';
import { useToast } from './Toast';

interface IOSNotificationGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function IOSNotificationGuideModal({ isOpen, onClose, userId }: IOSNotificationGuideModalProps) {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleTest = async () => {
    const result = await sendTestNotification(userId);
    if (result.mode === 'denied') {
      showToast('As notificações estão bloqueadas no Safari. Toque em Ajustes > Safari > Notificações para permitir.', 'error');
    } else {
      showToast('Notificação de teste enviada com sucesso!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Notificações no Safari (iPhone)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  08h • 12h • 20h
                </span>
              </h2>
              <p className="text-xs text-slate-400">Guia oficial para ativar alertas no iOS Safari</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Explanation note */}
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-200 leading-relaxed flex items-start gap-2.5">
            <Bell className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Como a Apple gerencia o Safari:</span> No iOS, o navegador Safari requer que a plataforma seja adicionada à <strong>Tela de Início</strong> para disparar lembretes na tela de bloqueio com o app minimizado. Leva menos de 10 segundos:
            </div>
          </div>

          {/* 3 Step Cards */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  Toque no botão Compartilhar do Safari
                  <Share className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <p className="text-slate-400">
                  Na barra inferior do Safari no seu iPhone, toque no ícone de quadrado com uma seta para cima.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  Toque em "Adicionar à Tela de Início"
                  <PlusSquare className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-slate-400">
                  Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>. Confirme no canto superior direito.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5">
                  Abra pelo ícone e permita notificações
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-slate-400">
                  Abra o aplicativo pelo novo ícone verde <strong>Financeiro</strong> na sua tela inicial e toque em <strong>"Permitir"</strong> quando a caixa de diálogo surgir.
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-amber-300">Os lembretes exigem que o app esteja aberto. Esta versão não envia lembretes com o aplicativo fechado.</p>
          {/* Scheduled Times Summary */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              Horários padrão (ajuste em Configurações):
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-xs font-bold text-white block">08:00</span>
                <span className="text-[10px] text-emerald-400">Lançamentos Manhã</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-xs font-bold text-white block">12:00</span>
                <span className="text-[10px] text-amber-400">Almoço & Entradas</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-xs font-bold text-white block">20:00</span>
                <span className="text-[10px] text-indigo-400">Fechamento do Dia</span>
              </div>
            </div>
          </div>

          {/* Test Action */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={handleTest}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              Testar Notificação & Som Agora
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
            >
              Entendi, Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
