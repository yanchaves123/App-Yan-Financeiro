import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Client, Project, Transaction } from '../types';
import { formatCurrency, formatDate } from '../lib/formatters';

interface ClientsViewProps {
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  onOpenNewClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
}

export function ClientsView({
  clients,
  projects,
  transactions,
  onOpenNewClient,
  onEditClient,
  onDeleteClient,
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            Cadastro de Clientes
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe o faturamento histórico e projetos por parceiro comercial
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewClient}
          className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, empresa ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none transition"
          />
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-1">Nenhum cliente cadastrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Cadastre os clientes com quem você produz vídeos e presta serviços.
          </p>
          <button
            type="button"
            onClick={onOpenNewClient}
            className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientProjects = projects.filter((p) => p.clientId === client.id);
            const clientTotalBilled = clientProjects.reduce((acc, p) => acc + p.totalValue, 0);
            const clientTotalReceived = clientProjects.reduce((acc, p) => acc + p.receivedValue, 0);
            const clientTotalPending = clientProjects.reduce((acc, p) => acc + p.pendingValue, 0);

            return (
              <div
                key={client.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800/90 shadow-xl flex flex-col justify-between hover:border-slate-700 transition space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{client.name}</h3>
                      {client.company && (
                        <span className="text-xs text-slate-400 block mt-0.5">{client.company}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditClient(client)}
                        title="Editar cliente"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteClient(client.id)}
                        title="Excluir cliente"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-1.5 mt-3 text-xs text-slate-400">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{client.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Stats Card for this client */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold">Total Faturado:</span>
                      <span className="font-extrabold text-white">
                        {formatCurrency(clientTotalBilled)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">Recebido:</span>
                        <span className="text-emerald-400 font-bold">
                          {formatCurrency(clientTotalReceived)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Pendente:</span>
                        <span className="text-amber-400 font-bold">
                          {formatCurrency(clientTotalPending)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Projects Count & Last Projects */}
                <div className="pt-2 border-t border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-slate-400 font-medium">
                      Projetos: <strong className="text-white">{clientProjects.length}</strong>
                    </span>
                  </div>
                  {clientProjects.length > 0 && (
                    <div className="space-y-1">
                      {clientProjects.slice(0, 2).map((p) => (
                        <div key={p.id} className="text-[11px] text-slate-400 flex justify-between truncate">
                          <span className="truncate max-w-[170px]">• {p.name}</span>
                          <span className="text-slate-300 font-medium shrink-0 ml-1">
                            {formatCurrency(p.totalValue)}
                          </span>
                        </div>
                      ))}
                    </div>
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
