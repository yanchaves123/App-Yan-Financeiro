import { isValidDate } from './src/lib/finance';
import { getTodayDateString } from './src/lib/formatters';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint to parse natural language financial transactions
app.post('/api/parse-transaction', async (req, res) => {
  const { text, categories, accounts, clients, projects } = req.body;
  const today = isValidDate(req.body.today || '') ? req.body.today : getTodayDateString();
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Texto não fornecido' });
  }

  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY não configurada no servidor',
      fallback: true,
    });
  }

  try {
    const prompt = `
Você é o assistente inteligente do sistema financeiro Financeiro Pro para um profissional videomaker / prestador de serviços e suas finanças pessoais.
Analise a seguinte frase em português e extraia as informações financeiras para um lançamento:
"${text}"

Contexto disponível no sistema:
Categorias cadastradas: ${JSON.stringify(categories || [])}
Contas disponíveis: ${JSON.stringify(accounts || [])}
Clientes cadastrados: ${JSON.stringify(clients || [])}
Projetos cadastrados: ${JSON.stringify(projects || [])}
Data de hoje: ${today}

Retorne ESTRITAMENTE um objeto JSON válido (sem formatação markdown de código, apenas o JSON) com as seguintes chaves:
{
  "type": "income" ou "expense" ou "transfer",
  "description": "descrição concisa e clara",
  "amount": número com o valor (ex: 1500 ou 350.50),
  "date": "YYYY-MM-DD" (se mencionada ou data de hoje "${today}"),
  "category": "nome da categoria mais apropriada",
  "paymentMethod": "pix" | "credit_card" | "debit_card" | "bank_slip" | "cash" | "transfer",
  "status": "completed" (se recebido/pago) ou "pending" (se a receber/a pagar),
  "clientName": "nome do cliente se identificado ou null",
  "projectName": "nome do projeto se identificado ou null",
  "observations": "observação extraída ou null"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    return res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Erro ao processar transação com IA:', err);
    return res.status(500).json({
      error: err.message || 'Falha ao processar texto com Gemini',
      fallback: true,
    });
  }
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite middleware in dev or serve dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Financeiro Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
