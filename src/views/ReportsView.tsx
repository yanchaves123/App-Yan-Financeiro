import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  PieChart,
  Users,
  Briefcase,
  TrendingUp,
  FileText,
  DollarSign,
  Percent,
} from 'lucide-react';
import { Category, Client, Project, Transaction } from '../types';
import { getExpensesByCategory, getMonthFinancialSummary, getSixMonthEvolution } from '../lib/calculations';
import { formatCurrency, formatMonthYear } from '../lib/formatters';

interface ReportsViewProps {
  currentYearMonth: string;
  transactions: Transaction[];
  categories: Category[];
  clients: Client[];
  projects: Project[];
  onOpenExportModal: () => void;
}

export function ReportsView({
  currentYearMonth,
  transactions,
  categories,
  clients,
  projects,
  onOpenExportModal,
}: ReportsViewProps) {
  const [reportType, setReportType] = useState<
    'monthly' | 'categories' | 'clients' | 'professional' | 'evolution'
  >('monthly');

  const summary = getMonthFinancialSummary(transactions, currentYearMonth);
  const catMap = new Map(categories.map((c) => [c.id, { name: c.name, color: c.color, icon: c.icon, type: c.type }]));
  const categoryExpenses = getExpensesByCategory(transactions, catMap, currentYearMonth);
  const evolution = getSixMonthEvolution(transactions, currentYearMonth);

  // Professional Videomaker Report Calculations
  // Professional expenses: categories marked as expense_professional
  const professionalCategories = new Set(
    categories.filter((c) => c.type === 'expense_professional').map((c) => c.id)
  );

  const monthTxs = transactions.filter((t) => t.date.startsWith(currentYearMonth) && t.status === 'completed');
  const professionalRevenue = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const professionalExpenses = monthTxs
    .filter((t) => t.type === 'expense' && !t.isCardInvoicePayment && professionalCategories.has(t.categoryId))
    .reduce((acc, t) => acc + t.amount, 0);

  const personalExpenses = monthTxs
    .filter((t) => t.type === 'expense' && !t.isCardInvoicePayment && !professionalCategories.has(t.categoryId))
    .reduce((acc, t) => acc + t.amount, 0);

  const professionalProfit = professionalRevenue - professionalExpenses;
  const operationalMargin = professionalRevenue > 0 ? (professionalProfit / professionalRevenue) * 100 : 0;

  // Client billing breakdown
  const clientStats = clients.map((c) => {
    const clientProjects = projects.filter((p) => p.clientId === c.id);
    const totalBilled = clientProjects.reduce((acc, p) => acc + p.totalValue, 0);
    const totalReceived = clientProjects.reduce((acc, p) => acc + p.receivedValue, 0);
    const totalPending = clientProjects.reduce((acc, p) => acc + p.pendingValue, 0);
    return {
      client: c,
      totalBilled,
      totalReceived,
      totalPending,
      projectCount: clientProjects.length,
    };
  }).sort((a, b) => b.totalBilled - a.totalBilled);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Relatórios Financeiros & Análises
          </h2>
          <p className="text-xs text-slate-400">
            DRE gerencial, evolução patrimonial, faturamento por cliente e lucro operacional
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / PDF</span>
          </button>
          <button
            type="button"
            onClick={onOpenExportModal}
            className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setReportType('monthly')}
          className={`py-2 px-3.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 ${
            reportType === 'monthly' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Mensal
        </button>
        <button
          type="button"
          onClick={() => setReportType('professional')}
          className={`py-2 px-3.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 ${
            reportType === 'professional' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Profissional Videomaker
        </button>
        <button
          type="button"
          onClick={() => setReportType('categories')}
          className={`py-2 px-3.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 ${
            reportType === 'categories' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          Por Categoria
        </button>
        <button
          type="button"
          onClick={() => setReportType('clients')}
          className={`py-2 px-3.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 ${
            reportType === 'clients' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Por Cliente
        </button>
        <button
          type="button"
          onClick={() => setReportType('evolution')}
          className={`py-2 px-3.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-2 ${
            reportType === 'evolution' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Evolução Histórica
        </button>
      </div>

      {/* 1. Monthly Report */}
      {reportType === 'monthly' && (
        <div className="space-y-5">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                DRE Mensal • {formatMonthYear(currentYearMonth)}
              </h3>
              <span className="text-xs text-slate-400 font-mono">Balanço Consolidado</span>
            </div>

            <div className="divide-y divide-slate-800/80 text-sm">
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-300 font-medium">Receitas Totais Recebidas (+)</span>
                <span className="font-extrabold text-emerald-400">{formatCurrency(summary.totalIncome)}</span>
              </div>
              <div className="py-3 flex justify-between items-center">
                <span className="text-slate-300 font-medium">Despesas Totais Pagas (-)</span>
                <span className="font-extrabold text-rose-400">{formatCurrency(summary.totalExpense)}</span>
              </div>
              <div className="py-3 flex justify-between items-center bg-slate-950/40 px-3 rounded-xl mt-2">
                <span className="text-white font-bold">Resultado Líquido do Mês (=)</span>
                <span
                  className={`text-lg font-black ${
                    summary.netResult >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(summary.netResult)}
                </span>
              </div>
              <div className="py-3 flex justify-between items-center text-xs">
                <span className="text-slate-400">Taxa de Poupança / Economia</span>
                <span className="font-bold text-white">{summary.savingsRate.toFixed(1)}%</span>
              </div>
              <div className="py-3 flex justify-between items-center text-xs">
                <span className="text-slate-400">Contas Pendentes de Pagamento</span>
                <span className="font-bold text-amber-400">{formatCurrency(summary.pendingPayables)}</span>
              </div>
              <div className="py-3 flex justify-between items-center text-xs">
                <span className="text-slate-400">Recebimentos Pendentes de Clientes</span>
                <span className="font-bold text-teal-400">{formatCurrency(summary.pendingReceivables)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Professional Report (Videomaker) */}
      {reportType === 'professional' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-1">
                Faturamento Bruto
              </span>
              <span className="text-2xl font-black text-white">{formatCurrency(professionalRevenue)}</span>
              <span className="text-[10px] text-slate-400 block mt-1">Entradas em projetos e contratos</span>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block mb-1">
                Despesas Profissionais
              </span>
              <span className="text-2xl font-black text-rose-400">{formatCurrency(professionalExpenses)}</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Equipamentos, software, internet, terceirizados
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                Lucro Operacional Líquido
              </span>
              <span className="text-2xl font-black text-emerald-400">{formatCurrency(professionalProfit)}</span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Margem Operacional: {operationalMargin.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-white mb-2">Divisão de Custos (Pessoal vs Profissional)</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Custos Operacionais do Negócio</span>
                  <span className="font-bold text-white">{formatCurrency(professionalExpenses)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${summary.totalExpense > 0 ? (professionalExpenses / summary.totalExpense) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Despesas Pessoais / Vida</span>
                  <span className="font-bold text-white">{formatCurrency(personalExpenses)}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${summary.totalExpense > 0 ? (personalExpenses / summary.totalExpense) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. By Category Report */}
      {reportType === 'categories' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            Detalhamento de Despesas por Categoria ({formatMonthYear(currentYearMonth)})
          </h3>

          {categoryExpenses.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Nenhuma despesa para exibir no período selecionado.
            </div>
          ) : (
            <div className="space-y-4">
              {categoryExpenses.map((cat) => (
                <div key={cat.categoryId} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                    <span className="font-extrabold text-white text-sm">
                      {formatCurrency(cat.total)}
                      <span className="text-xs text-slate-400 font-normal ml-1">
                        ({cat.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. By Client Report */}
      {reportType === 'clients' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            Faturamento e Performance por Cliente
          </h3>

          <div className="space-y-3">
            {clientStats.map((item) => (
              <div
                key={item.client.id}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{item.client.name}</h4>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {item.client.company || item.client.city} • {item.projectCount} trabalhos realizados
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-right">
                  <div>
                    <span className="text-slate-500 block">Faturado:</span>
                    <span className="font-extrabold text-white">{formatCurrency(item.totalBilled)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Recebido:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(item.totalReceived)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Pendente:</span>
                    <span className="font-bold text-amber-400">{formatCurrency(item.totalPending)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Historical Evolution Report */}
      {reportType === 'evolution' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
            Evolução Histórica dos Últimos Meses
          </h3>

          <div className="divide-y divide-slate-800/80 text-xs">
            {evolution.map((point) => (
              <div key={point.monthKey} className="py-3.5 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">{point.label}</span>
                  <span className="text-slate-400">{point.monthKey}</span>
                </div>

                <div className="flex items-center gap-4 sm:gap-8 text-right">
                  <div>
                    <span className="text-slate-500 block">Receitas:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(point.income)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Despesas:</span>
                    <span className="font-bold text-rose-400">{formatCurrency(point.expense)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Saldo Líquido:</span>
                    <span
                      className={`font-extrabold ${
                        point.net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(point.net)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
