import { getTodayDateString } from './formatters';
import { Category, Account, Client, Project, PaymentMethod } from '../types';

export interface ParsedTransactionResult {
  type: 'income' | 'expense' | 'transfer';
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId?: string;
  categoryName?: string;
  accountId?: string;
  destinationAccountId?: string;
  paymentMethod: PaymentMethod;
  creditCardId?: string;
  status: 'completed' | 'pending';
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  observations?: string;
  confidenceSource: 'ai' | 'fallback';
}

export async function parseTransactionFromText(
  text: string,
  categories: Category[],
  accounts: Account[],
  clients: Client[],
  projects: Project[]
): Promise<ParsedTransactionResult> {
  const cleanText = text.trim();
  const today = getTodayDateString();

  // 1. Try server-side AI parsing via Gemini API endpoint
  try {
    const response = await fetch('/api/parse-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        today,
        categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
        accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
        clients: clients.map((c) => ({ id: c.id, name: c.name })),
        projects: projects.map((p) => ({ id: p.id, name: p.name })),
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        const d = result.data;
        // Match category ID
        const matchedCategory = categories.find(
          (c) =>
            c.name.toLowerCase() === (d.category || '').toLowerCase() ||
            c.id === d.categoryId
        );

        // Match account ID
        const matchedAccount = accounts.find(
          (a) =>
            a.name.toLowerCase() === (d.account || '').toLowerCase() ||
            a.id === d.accountId
        ) || accounts[0];

        // Match client ID
        const matchedClient = clients.find(
          (cl) =>
            cl.id === d.clientId ||
            (d.clientName && cl.name.toLowerCase().includes(d.clientName.toLowerCase()))
        );

        // Match project ID
        const matchedProject = projects.find(
          (p) =>
            p.id === d.projectId ||
            (d.projectName && p.name.toLowerCase().includes(d.projectName.toLowerCase()))
        );

        return {
          type: d.type === 'income' ? 'income' : d.type === 'transfer' ? 'transfer' : 'expense',
          description: d.description || cleanText,
          amount: typeof d.amount === 'number' ? d.amount : parseFloat(d.amount) || 0,
          date: d.date || today,
          categoryId: matchedCategory?.id || categories.find(c => (d.type === 'income') === (c.type === 'income'))?.id,
          categoryName: matchedCategory?.name,
          accountId: matchedAccount?.id,
          paymentMethod: (d.paymentMethod as PaymentMethod) || 'pix',
          status: d.status === 'pending' ? 'pending' : 'completed',
          clientId: matchedClient?.id,
          clientName: matchedClient?.name,
          projectId: matchedProject?.id,
          projectName: matchedProject?.name,
          observations: d.observations || '',
          confidenceSource: 'ai',
        };
      }
    }
  } catch (err) {
    console.warn('API Gemini indisponível ou offline, usando analisador inteligente local', err);
  }

  // 2. Intelligent local rule-based Brazilian Portuguese Parser
  return parseLocallyWithRules(cleanText, categories, accounts, clients, projects, today);
}

function parseLocallyWithRules(
  text: string,
  categories: Category[],
  accounts: Account[],
  clients: Client[],
  projects: Project[],
  today: string
): ParsedTransactionResult {
  const lower = text.toLowerCase();

  // Determine type
  let type: 'income' | 'expense' | 'transfer' = 'expense';
  if (
    lower.includes('recebi') ||
    lower.includes('entrada') ||
    lower.includes('ganhei') ||
    lower.includes('recebimento') ||
    lower.includes('faturamento') ||
    lower.includes('sinal') ||
    lower.includes('pagou') ||
    lower.includes('cliente pagou')
  ) {
    type = 'income';
  } else if (lower.includes('transferi') || lower.includes('transferência') || lower.includes('transferir')) {
    type = 'transfer';
  }

  // Extract amount: e.g. "R$ 1.500,00" or "1500 reais" or "350,50" or "350"
  let amount = 0;
  const currencyMatch =
    text.match(/r\$\s*([\d\.,]+)/i) ||
    text.match(/([\d\.,]+)\s*reais/i) ||
    text.match(/(?:por|de|valor|custou|total)?\s*([\d\.,]+)/i);

  if (currencyMatch && currencyMatch[1]) {
    const raw = currencyMatch[1];
    const rawNum = raw.includes(',') || /^\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, '').replace(',', '.') : raw;
    const parsed = parseFloat(rawNum);
    if (!isNaN(parsed)) amount = parsed;
  }

  // Payment method detection
  let paymentMethod: PaymentMethod = 'pix';
  if (lower.includes('débito') || lower.includes('debito')) {
    paymentMethod = 'debit_card';
  } else if (lower.includes('cartão') || lower.includes('credito') || lower.includes('crédito')) {
    paymentMethod = 'credit_card';
  } else if (lower.includes('boleto')) {
    paymentMethod = 'bank_slip';
  } else if (lower.includes('dinheiro') || lower.includes('espécie')) {
    paymentMethod = 'cash';
  } else if (lower.includes('pix')) {
    paymentMethod = 'pix';
  } else if (lower.includes('ted') || lower.includes('doc') || lower.includes('transferência')) {
    paymentMethod = 'transfer';
  }

  // Detect Client
  let matchedClient = clients.find((c) => lower.includes(c.name.toLowerCase()));
  if (!matchedClient) {
    // Check known words like "prefeitura", "academia", etc.
    matchedClient = clients.find((c) =>
      c.company && lower.includes(c.company.toLowerCase())
    );
  }

  // Detect Project
  let matchedProject = projects.find((p) => lower.includes(p.name.toLowerCase()));
  if (!matchedProject && (lower.includes('peão') || lower.includes('festa'))) {
    matchedProject = projects.find((p) => p.name.toLowerCase().includes('peão'));
  }

  // Detect Category
  let matchedCategory: Category | undefined;
  if (type === 'income') {
    if (lower.includes('projeto') || lower.includes('vídeo') || lower.includes('video') || lower.includes('peão') || lower.includes('trabalho')) {
      matchedCategory = categories.find((c) => c.name.toLowerCase().includes('projeto') || c.name.toLowerCase().includes('trabalho'));
    } else if (lower.includes('contrato') || lower.includes('mensalidade')) {
      matchedCategory = categories.find((c) => c.name.toLowerCase().includes('contrato'));
    } else {
      matchedCategory = categories.find((c) => c.type === 'income');
    }
  } else {
    // Expense categories
    if (lower.includes('gasolina') || lower.includes('combustível') || lower.includes('uber') || lower.includes('estacionamento') || lower.includes('pedágio')) {
      matchedCategory = categories.find((c) => c.name.toLowerCase().includes('transporte'));
    } else if (lower.includes('almoço') || lower.includes('jantar') || lower.includes('mercado') || lower.includes('comida') || lower.includes('restaurante')) {
      matchedCategory = categories.find((c) => c.name.toLowerCase().includes('alimentação'));
    } else if (lower.includes('adobe') || lower.includes('software') || lower.includes('licença') || lower.includes('cloud') || lower.includes('drive')) {
      matchedCategory = categories.find((c) => c.name.toLowerCase().includes('software'));
    } else if (lower.includes('câmera') || lower.includes('lente') || lower.includes('tripé') || lower.includes('equipamento') || lower.includes('microfone') || lower.includes('drone')) {
      matchedCategory = categories.find((c) => c.name.toLowerCase().includes('equipamento'));
    } else if (lower.includes('internet') || lower.includes('fibra') || lower.includes('wifi')) {
      matchedCategory = categories.find((c) => c.name.toLowerCase().includes('internet'));
    } else if (lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('luz') || lower.includes('energia')) {
      matchedCategory = categories.find((c) => c.name.toLowerCase().includes('moradia'));
    } else {
      matchedCategory = categories.find((c) => c.type !== 'income');
    }
  }

  // Account
  const matchedAccount = accounts.find((a) => lower.includes(a.name.toLowerCase())) || accounts[0];

  // Description cleanup
  let description = text;
  // If phrase was e.g. "Recebi 1500 reais da prefeitura pelo vídeo da festa do peão"
  if (lower.includes('vídeo') || lower.includes('video')) {
    const vMatch = text.match(/(?:pelo|para|de|sobre)\s+(vídeo[^\.,]+)/i);
    if (vMatch && vMatch[1]) {
      description = vMatch[1].charAt(0).toUpperCase() + vMatch[1].slice(1);
    }
  } else if (lower.includes('gasolina')) {
    description = 'Combustível / Gasolina';
  }

  return {
    type,
    description: description || (type === 'income' ? 'Receita' : 'Despesa'),
    amount: amount || 0,
    date: today,
    categoryId: matchedCategory?.id || categories.find(c => (type === 'income') === (c.type === 'income'))?.id,
    categoryName: matchedCategory?.name,
    accountId: matchedAccount?.id,
    paymentMethod,
    status: 'completed',
    clientId: matchedClient?.id,
    clientName: matchedClient?.name,
    projectId: matchedProject?.id,
    projectName: matchedProject?.name,
    observations: text,
    confidenceSource: 'fallback',
  };
}
