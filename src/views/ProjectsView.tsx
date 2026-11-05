import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  User as UserIcon,
  Edit2,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Client, Project, ProjectStatus } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  onOpenNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenPaymentModal: (project: Project) => void;
}

export function ProjectsView({
  projects,
  clients,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onOpenPaymentModal,
}: ProjectsViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const clientMap = new Map(clients.map((c) => [c.id, c]));

  // Stats calculation
  const totalBilled = projects.reduce((acc, p) => acc + p.totalValue, 0);
  const totalReceived = projects.reduce((acc, p) => acc + (p.receivedValue || 0), 0);
  const totalPending = projects.reduce((acc, p) => acc + (p.pendingValue || 0), 0);

  const filteredProjects = projects.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const client = clientMap.get(p.clientId);
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesClient = client?.name.toLowerCase().includes(q);
      const matchesDesc = p.description?.toLowerCase().includes(q);
      if (!matchesName && !matchesClient && !matchesDesc) return false;
    }
    return true;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'budget':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">Orçamento</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Aprovado</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">Em Andamento</span>;
      case 'delivered':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Entregue</span>;
      case 'waiting_payment':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Aguardando Pagamento</span>;
      case 'paid':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ Pago</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Cancelado</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-teal-400" />
            Projetos Audiovisuais
          </h2>
          <p className="text-xs text-slate-400">
            Controle completo de trabalhos para clientes, filmagens e faturamento
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewProject}
          className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Projeto</span>
        </button>
      </div>

      {/* KPI Cards for Projects */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Faturamento Total em Projetos
          </span>
          <span className="text-xl font-extrabold text-white">{formatCurrency(totalBilled)}</span>
          <span className="text-[10px] text-slate-500 block mt-1">{projects.length} projetos cadastrados</span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
            Total Já Recebido
          </span>
          <span className="text-xl font-extrabold text-emerald-400">{formatCurrency(totalReceived)}</span>
          <span className="text-[10px] text-slate-500 block mt-1">
            {totalBilled > 0 ? `${((totalReceived / totalBilled) * 100).toFixed(0)}% liquidado` : '0%'}
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-1">
            Total Pendente a Cobrar
          </span>
          <span className="text-xl font-extrabold text-amber-400">{formatCurrency(totalPending)}</span>
          <span className="text-[10px] text-slate-500 block mt-1">Previsão de entrada futura</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome do projeto ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-teal-500 rounded-2xl p-2.5 text-xs text-white outline-none cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="in_progress">Em Andamento</option>
              <option value="waiting_payment">Aguardando Pagamento</option>
              <option value="delivered">Entregues</option>
              <option value="approved">Aprovados</option>
              <option value="budget">Orçamentos</option>
              <option value="paid">Pagos (Finalizados)</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-1">Nenhum projeto encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Cadastre os trabalhos audiovisuais para acompanhar valores faturados e recebimentos.
          </p>
          <button
            type="button"
            onClick={onOpenNewProject}
            className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const client = clientMap.get(p.clientId);
            const progress = p.totalValue > 0 ? (p.receivedValue / p.totalValue) * 100 : 0;

            return (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800/90 shadow-xl flex flex-col justify-between hover:border-slate-700 transition space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {getStatusBadge(p.status)}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditProject(p)}
                        title="Editar projeto"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(p.id)}
                        title="Excluir projeto"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{p.name}</h3>

                  <div className="flex items-center gap-1.5 text-xs text-sky-400 font-medium mb-3">
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{client?.name || 'Cliente'}</span>
                    {client?.company && <span className="text-slate-500">• {client.company}</span>}
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">{p.description}</p>
                  )}

                  {/* Financial Bar of Project */}
                  <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Valor Total:</span>
                      <span className="font-extrabold text-white">{formatCurrency(p.totalValue)}</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] pt-1">
                      <span className="text-emerald-400 font-semibold">
                        Recebido: {formatCurrency(p.receivedValue)}
                      </span>
                      <span className="text-amber-400 font-semibold">
                        Pendente: {formatCurrency(p.pendingValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    <span>Prazo: {formatDate(p.paymentDeadline)}</span>
                  </div>

                  {p.pendingValue > 0 ? (
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal(p)}
                      className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1 active:scale-95"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Receber
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Concluído
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
