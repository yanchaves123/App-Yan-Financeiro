import React, { useState, useEffect } from 'react';
import { Search, X, ArrowUpRight, ArrowDownRight, Briefcase, User, Wallet, CreditCard as CardIcon, Tag } from 'lucide-react';
import { Account, Category, Client, CreditCard, Project, Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  clients: Client[];
  projects: Project[];
  accounts: Account[];
  creditCards: CreditCard[];
  categories: Category[];
  onSelectTransaction?: (tx: Transaction) => void;
  onSelectProject?: (proj: Project) => void;
  onSelectClient?: (client: Client) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  transactions,
  clients,
  projects,
  accounts,
  creditCards,
  categories,
  onSelectTransaction,
  onSelectProject,
  onSelectClient,
}: GlobalSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const term = searchTerm.toLowerCase().trim();

  const matchingTransactions = term
    ? transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(term) ||
          (t.observations && t.observations.toLowerCase().includes(term))
      ).slice(0, 5)
    : [];

  const matchingProjects = term
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.description && p.description.toLowerCase().includes(term))
      ).slice(0, 4)
    : [];

  const matchingClients = term
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.company && c.company.toLowerCase().includes(term)) ||
          (c.city && c.city.toLowerCase().includes(term))
      ).slice(0, 4)
    : [];

  const matchingAccounts = term
    ? accounts.filter((a) => a.name.toLowerCase().includes(term) || a.institution.toLowerCase().includes(term))
    : [];

  const matchingCards = term
    ? creditCards.filter((c) => c.name.toLowerCase().includes(term) || c.institution.toLowerCase().includes(term))
    : [];

  const hasResults =
    matchingTransactions.length > 0 ||
    matchingProjects.length > 0 ||
    matchingClients.length > 0 ||
    matchingAccounts.length > 0 ||
    matchingCards.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up">
        {/* Search input header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar lançamentos, clientes, projetos, contas, cartões..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-base font-medium"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results area */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4">
          {!searchTerm && (
            <div className="text-center py-8 text-slate-500 text-sm">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              Digite o nome de um projeto, cliente, categoria ou lançamento...
            </div>
          )}

          {searchTerm && !hasResults && (
            <div className="text-center py-8 text-slate-500 text-sm">
              Nenhum resultado encontrado para "{searchTerm}".
            </div>
          )}

          {/* Transactions */}
          {matchingTransactions.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Lançamentos ({matchingTransactions.length})
              </span>
              <div className="space-y-1.5">
                {matchingTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      onSelectTransaction?.(tx);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          tx.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">{tx.description}</span>
                        <span className="text-xs text-slate-400">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {matchingProjects.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Projetos ({matchingProjects.length})
              </span>
              <div className="space-y-1.5">
                {matchingProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => {
                      onSelectProject?.(proj);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">{proj.name}</span>
                        <span className="text-xs text-slate-400">Total: {formatCurrency(proj.totalValue)}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {proj.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {matchingClients.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Clientes ({matchingClients.length})
              </span>
              <div className="space-y-1.5">
                {matchingClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => {
                      onSelectClient?.(client);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">{client.name}</span>
                        <span className="text-xs text-slate-400">{client.company || client.city}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
