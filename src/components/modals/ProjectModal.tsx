import { useDefaultDate } from '../../hooks/useCalendar';
import { isValidDate } from '../../lib/finance';
import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calendar, DollarSign, User as UserIcon } from 'lucide-react';
import { Account, Client, PaymentMethod, Project, ProjectStatus } from '../../types';
import { getTodayDateString } from '../../lib/formatters';

export type ProjectDraft = Partial<Project> & { initialPaymentAccountId?: string };

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proj: ProjectDraft) => void;
  projectToEdit?: Project | null;
  clients: Client[];
  accounts: Account[];
}

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
  clients,
  accounts,
}: ProjectModalProps) {
  const [initialPaymentAccountId, setInitialPaymentAccountId] = useState('');
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalValueStr, setTotalValueStr] = useState('');
  const [projectDate, setProjectDate, resetProjectDate] = useDefaultDate(isOpen, !!projectToEdit);
  const [paymentDeadline, setPaymentDeadline, resetPaymentDeadline] = useDefaultDate(isOpen, !!projectToEdit);
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [receivedValueStr, setReceivedValueStr] = useState('0');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMessage('');
    setInitialPaymentAccountId(accounts[0]?.id || '');
    if (projectToEdit) {
      setClientId(projectToEdit.clientId);
      setName(projectToEdit.name);
      setDescription(projectToEdit.description || '');
      setTotalValueStr(String(projectToEdit.totalValue));
      setProjectDate(projectToEdit.projectDate);
      setPaymentDeadline(projectToEdit.paymentDeadline);
      setStatus(projectToEdit.status);
      setPaymentMethod(projectToEdit.paymentMethod || 'pix');
      setReceivedValueStr(String(projectToEdit.receivedValue || 0));
      setNotes(projectToEdit.notes || '');
    } else {
      setClientId(clients[0]?.id || '');
      setName('');
      setDescription('');
      setTotalValueStr('');
      resetProjectDate();
      resetPaymentDeadline();
      setStatus('in_progress');
      setPaymentMethod('pix');
      setReceivedValueStr('0');
      setNotes('');
    }
  }, [projectToEdit?.id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const totalValue = parseFloat(totalValueStr.replace(',', '.'));
    const receivedValue = parseFloat(receivedValueStr.replace(',', '.')) || 0;

    if (!name.trim()) {
      setErrorMessage('Informe o nome do projeto.');
      return;
    }
    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      setErrorMessage('Informe um valor total válido para o projeto.');
      return;
    }

    if (!clients.some(c => c.id === clientId) || !isValidDate(projectDate) || !isValidDate(paymentDeadline)) {
      setErrorMessage('Selecione um cliente e datas válidas.'); return;
    }
    if (!Number.isFinite(receivedValue) || receivedValue < 0 || receivedValue > totalValue) {
      setErrorMessage('O valor recebido deve ficar entre zero e o valor total.'); return;
    }
    if (!projectToEdit && receivedValue > 0 && !accounts.some(a => a.id === initialPaymentAccountId)) {
      setErrorMessage('Selecione a conta que recebeu o valor inicial.'); return;
    }
    const pendingValue = Math.max(0, totalValue - receivedValue);

    onSave({
      ...projectToEdit,
      id: projectToEdit?.id,
      initialPaymentAccountId,
      clientId: clientId || clients[0]?.id,
      name: name.trim(),
      description: description.trim() || undefined,
      totalValue,
      projectDate,
      paymentDeadline,
      status: status === 'cancelled' ? 'cancelled' : pendingValue === 0 && receivedValue > 0 ? 'paid' : status === 'paid' ? 'waiting_payment' : status,
      paymentMethod,
      receivedValue,
      pendingValue,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {projectToEdit ? 'Editar Projeto Audiovisual' : 'Novo Projeto de Trabalho'}
              </h2>
              <p className="text-xs text-slate-400">Controle de trabalhos para clientes e produções</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Client Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              Cliente
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome do Projeto
            </label>
            <input
              type="text"
              placeholder="ex: Vídeos Festa do Peão 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Descrição do Serviço
            </label>
            <textarea
              rows={2}
              placeholder="ex: Cobertura de 3 dias, captação com drone e 5 Reels..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm resize-none"
            />
          </div>

          {/* Values Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="3000,00"
                value={totalValueStr}
                onChange={(e) => setTotalValueStr(e.target.value)}
                required
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white font-bold outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-sky-400" />
                Valor Já Recebido (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                readOnly={!!projectToEdit}
                value={receivedValueStr}
                onChange={(e) => setReceivedValueStr(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white font-bold outline-none transition text-sm"
              />
            </div>
          </div>

          {projectToEdit ? (
            <p className="text-xs text-slate-400">O valor recebido é atualizado pelos lançamentos vinculados ao projeto.</p>
          ) : Number(receivedValueStr.replace(',', '.')) > 0 && (
            <div>
              <label className="block text-xs text-slate-400 mb-2">Conta do recebimento inicial</label>
              <select required value={initialPaymentAccountId} onChange={e => setInitialPaymentAccountId(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-white">
                <option value="">Selecione uma conta</option>
                {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
              <p className="text-xs text-slate-400 mt-2">Será criada uma receita na data do projeto.</p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Data do Projeto
              </label>
              <input
                type="date"
                value={projectDate}
                onChange={(e) => setProjectDate(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Prazo de Pagamento
              </label>
              <input
                type="date"
                value={paymentDeadline}
                onChange={(e) => setPaymentDeadline(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white outline-none transition text-sm"
              />
            </div>
          </div>

          {/* Status & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status do Projeto
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="budget">Orçamento</option>
                <option value="approved">Aprovado</option>
                <option value="in_progress">Em Andamento</option>
                <option value="delivered">Entregue</option>
                <option value="waiting_payment">Aguardando Pagamento</option>
                <option value="paid">Pago</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white outline-none transition text-sm cursor-pointer"
              >
                <option value="pix">Pix</option>
                <option value="bank_slip">Boleto Bancário</option>
                <option value="transfer">Transferência / TED</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="cash">Dinheiro em Espécie</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações
            </label>
            <input
              type="text"
              placeholder="ex: 50% no sinal, 50% na aprovação final do material"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-xl shadow-teal-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Salvar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
