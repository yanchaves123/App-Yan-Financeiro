import React, { useState, useEffect } from 'react';
import { X, User as UserIcon } from 'lucide-react';
import { Client } from '../../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  clientToEdit?: Client | null;
  userId: string;
}

export function ClientModal({
  isOpen,
  onClose,
  onSave,
  clientToEdit,
  userId,
}: ClientModalProps) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');
    if (clientToEdit) {
      setName(clientToEdit.name);
      setCompany(clientToEdit.company || '');
      setPhone(clientToEdit.phone || '');
      setEmail(clientToEdit.email || '');
      setCity(clientToEdit.city || '');
      setNotes(clientToEdit.notes || '');
    } else {
      setName('');
      setCompany('');
      setPhone('');
      setEmail('');
      setCity('');
      setNotes('');
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!name.trim()) {
      setErrorMessage('Informe o nome do cliente.');
      return;
    }

    const clientId = clientToEdit?.id || `client_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    onSave({
      id: clientId,
      userId,
      name: name.trim(),
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: clientToEdit?.createdAt || new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-xs text-slate-400">Cadastre clientes para associar a projetos e receitas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome do Contato
            </label>
            <input
              type="text"
              placeholder="ex: João Silva / Marina Costa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Empresa / Órgão
            </label>
            <input
              type="text"
              placeholder="ex: Prefeitura Municipal, FitCorp..."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(19) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Cidade / UF
              </label>
              <input
                type="text"
                placeholder="Campinas, SP"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              placeholder="contato@cliente.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Preferências de faturamento, prazos habituais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-sky-500 rounded-2xl p-3 text-white placeholder-slate-600 outline-none transition text-sm resize-none"
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
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-xl shadow-sky-600/25 transition-all duration-200 active:scale-[0.99] text-base"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
