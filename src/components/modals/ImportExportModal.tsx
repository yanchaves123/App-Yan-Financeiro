import { exportTransactionsCSV, importTransactionsCSV } from '../../lib/csv';
import React, { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { Account, Category, Transaction } from '../../types';
import { formatCurrency, formatDate, getTodayDateString, getCurrentMonthYear } from '../../lib/formatters';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onImportTransactions: (txs: Transaction[]) => void | boolean;
  userId: string;
}

export function ImportExportModal({
  isOpen,
  onClose,
  transactions,
  categories,
  accounts,
  onImportTransactions,
  userId,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [previewRows, setPreviewRows] = useState<any[]>([]);

  if (!isOpen) return null;

  // Export CSV
  const handleExportCSV = (scope: 'all' | 'month' | 'payables' | 'receivables') => {
    let filtered = transactions;
    let filename = 'financeiro_pro_lancamentos.csv';

    if (scope === 'month') {
      filtered = transactions.filter((t) => t.date.startsWith(getCurrentMonthYear()));
      filename = `financeiro_pro_${getCurrentMonthYear()}.csv`;
    } else if (scope === 'payables') {
      filtered = transactions.filter((t) => t.type === 'expense' && t.status !== 'completed');
      filename = 'financeiro_pro_contas_a_pagar.csv';
    } else if (scope === 'receivables') {
      filtered = transactions.filter((t) => t.type === 'income' && t.status !== 'completed');
      filename = 'financeiro_pro_contas_a_receber.csv';
    }

    const blob = new Blob([exportTransactionsCSV(filtered, categories)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // CSV Import parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);

      try {
        const parsed = importTransactionsCSV(text, categories, userId, accountId || accounts[0]?.id || '');
        setPreviewRows(parsed); setError('');
      } catch (error) { setPreviewRows([]); setError((error as Error).message); }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (previewRows.length === 0) return;

    try {
      const rows = importTransactionsCSV(csvContent, categories, userId, accountId || accounts[0]?.id || '');
      if (onImportTransactions(rows) !== false) onClose();
    } catch (error) { setError((error as Error).message); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Importar & Exportar Dados</h2>
              <p className="text-xs text-slate-400">Planilhas CSV e relatórios financeiros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
              activeTab === 'export' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 ${
              activeTab === 'import' ? 'bg-emerald-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && <p role="alert" className="text-rose-400 text-sm">{error}</p>}
          {activeTab === 'import' && <label className="block text-sm text-slate-300">Conta para CSV simples
            <select aria-label="Conta para importação" value={accountId || accounts[0]?.id || ''} onChange={e=>setAccountId(e.target.value)} className="bg-slate-950 p-2 rounded-xl w-full">
              {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>}
          {activeTab === 'export' ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Selecione o formato de dados que deseja exportar para planilha Excel / Google Sheets:
              </p>

              <button
                type="button"
                onClick={() => handleExportCSV('all')}
                className="w-full p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">Todos os Lançamentos</h4>
                  <p className="text-xs text-slate-400">Histórico completo de receitas, despesas e transferências</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleExportCSV('month')}
                className="w-full p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">Lançamentos do Mês Atual (Setembro 2026)</h4>
                  <p className="text-xs text-slate-400">Exporta somente as movimentações deste período</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleExportCSV('receivables')}
                className="w-full p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">Contas a Receber</h4>
                  <p className="text-xs text-slate-400">Relatório de receitas pendentes e faturamentos a cobrar</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleExportCSV('payables')}
                className="w-full p-3.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 text-left transition flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">Contas a Pagar</h4>
                  <p className="text-xs text-slate-400">Relatório de despesas agendadas e pendentes</p>
                </div>
                <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Selecione o arquivo CSV
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <span className="text-sm font-medium text-white block">Clique para enviar o arquivo .CSV</span>
                    <span className="text-xs text-slate-400 block mt-1">
                      CSV separado por ponto e vírgula: Data;Descrição;Valor;Tipo (Receita/Despesa);Categoria. O CSV completo do app preserva os vínculos.
                    </span>
                  </label>
                </div>
              </div>

              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    {previewRows.length} registros identificados para importação:
                  </span>
                  <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-950/80 border border-slate-800 p-2 text-xs divide-y divide-slate-800/80">
                    {previewRows.slice(0, 5).map((row, i) => (
                      <div key={i} className="py-1.5 flex justify-between">
                        <span className="text-slate-300 truncate max-w-[200px]">{row.description}</span>
                        <span className="font-semibold text-white">{formatCurrency(row.amount)}</span>
                      </div>
                    ))}
                    {previewRows.length > 5 && (
                      <p className="text-[11px] text-slate-500 pt-1 text-center">
                        + {previewRows.length - 5} outros itens...
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/25 transition mt-2"
                  >
                    Confirmar Importação de {previewRows.length} Registros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
