import React from 'react';
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  Building,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingUp,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Account, AccountType, Transaction } from '../types';
import { calculateAccountBalance, calculateTotalAvailableBalance } from '../lib/calculations';
import { formatCurrency } from '../lib/formatters';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onOpenNewAccount: () => void;
  onEditAccount: (account: Account) => void;
  onDeleteAccount: (accountId: string) => void;
  onOpenTransferModal: () => void;
}

export function AccountsView({
  accounts,
  transactions,
  onOpenNewAccount,
  onEditAccount,
  onDeleteAccount,
  onOpenTransferModal,
}: AccountsViewProps) {
  const totalBalance = calculateTotalAvailableBalance(accounts, transactions);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'checking':
        return <Building className="w-5 h-5" />;
      case 'digital':
        return <CreditCard className="w-5 h-5" />;
      case 'savings':
        return <PiggyBank className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const getAccountTypeLabel = (type: AccountType) => {
    switch (type) {
      case 'checking':
        return 'Conta Corrente';
      case 'digital':
        return 'Conta Digital';
      case 'savings':
        return 'Poupança';
      case 'investment':
        return 'Investimentos';
      case 'cash':
        return 'Dinheiro Físico';
      case 'wallet':
        return 'Carteira';
      default:
        return 'Conta';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-400" />
            Minhas Contas & Carteiras
          </h2>
          <p className="text-xs text-slate-400">
            Acompanhe o saldo real calculado dinamicamente em cada instituição
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={onOpenTransferModal}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transferir</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewAccount}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Total Balance Hero Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Patrimônio Líquido Disponível
          </span>
          <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {formatCurrency(totalBalance)}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            Soma dos saldos atuais de todas as contas e carteiras ativas
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <span className="font-bold text-white block text-sm">{accounts.length}</span>
            <span>Contas ativas</span>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const currentBalance = calculateAccountBalance(acc, transactions);

          return (
            <div
              key={acc.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800/90 shadow-xl flex flex-col justify-between hover:border-slate-700 transition space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: acc.color }}
                    >
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{acc.name}</h3>
                      <span className="text-xs text-slate-400 block">
                        {acc.institution} • {getAccountTypeLabel(acc.type)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditAccount(acc)}
                      title="Editar conta"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteAccount(acc.id)}
                        title="Excluir conta"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Saldo Atual
                  </span>
                  <span
                    className={`text-2xl font-black block mt-0.5 ${
                      currentBalance >= 0 ? 'text-white' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(currentBalance)}
                  </span>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
                    <span>Saldo inicial: {formatCurrency(acc.initialBalance)}</span>
                    <span className="text-emerald-400 font-semibold">Atualizado dinamicamente</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={onOpenTransferModal}
                  className="text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Transferir desta conta
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
