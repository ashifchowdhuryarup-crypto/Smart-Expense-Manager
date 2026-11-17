import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Housing & Rent',
  'Utilities & Internet',
  'Transportation',
  'Shopping',
  'Healthcare & Medical',
  'Entertainment & Leisure',
  'Education & Books',
  'Family & Personal',
  'Debt & Loans',
  'Other Expenses',
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Business',
  'Rental Income',
  'Bonus & Grants',
  'Gifts',
  'Other Income',
];

const PAYMENT_METHODS = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
];

interface ParseEntryRequestBody {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  currency?: string;
  knownProjects?: string[];
  today?: string;
}

function extractReadableError(err: unknown): { status: number; message: string } {
  const errObj = err as { status?: number; message?: string };
  let status = typeof errObj?.status === 'number' ? errObj.status : 500;
  let message = errObj?.message || 'Failed to parse entry with Gemini AI.';

  if (typeof message === 'string' && message.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(message);
      if (parsed?.error?.message) {
        message = String(parsed.error.message);
      }
      if (typeof parsed?.error?.code === 'number') {
        status = parsed.error.code;
      }
    } catch {
      // keep original message
    }
  }

  return { status, message };
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.post('/api/ai/parse-entry', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
        return;
      }

      const body = (req.body || {}) as ParseEntryRequestBody;
      const rawText = typeof body.text === 'string' ? body.text.trim() : '';
      const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
      const mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')
        ? body.mimeType
        : 'image/jpeg';
      const defaultCurrency = typeof body.currency === 'string' && body.currency.trim()
        ? body.currency.trim()
        : 'BDT';
      const today = typeof body.today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.today)
        ? body.today
        : new Date().toISOString().split('T')[0];
      const knownProjects = Array.isArray(body.knownProjects)
        ? body.knownProjects.filter((p): p is string => typeof p === 'string' && p.trim().length > 0).slice(0, 20)
        : [];

      if (!rawText && !imageBase64) {
        res.status(400).json({
          error: 'Provide SMS/receipt/recipe text or upload a receipt image to parse.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const systemInstruction = [
        'You are a precision financial transaction extractor for Smart Expense Manager.',
        'Extract a single structured transaction from the user input, which may be:',
        '1) A bank, credit card, or mobile money SMS alert (e.g., bKash, Nagad, Rocket, DBBL, City Bank, Brac Bank, Stripe, PayPal).',
        '2) A printed or digital receipt, invoice, or restaurant/grocery bill (image or text).',
        '3) A recipe or itemized shopping list with prices (sum total cost or total spent on ingredients as a Groceries or Food & Dining expense).',
        '',
        `Today's date is ${today}. Default currency context is ${defaultCurrency}.`,
        `Valid expense categories: ${EXPENSE_CATEGORIES.join(', ')}.`,
        `Valid income categories: ${INCOME_CATEGORIES.join(', ')}.`,
        `Valid payment methods: ${PAYMENT_METHODS.join(', ')}.`,
        knownProjects.length > 0
          ? `Known user client/project tags (match if relevant): ${knownProjects.join(', ')}.`
          : 'If a client name or project is explicitly mentioned, extract it into clientProject; otherwise omit or return empty string.',
        'Determine whether this looks like a recurring bill/subscription (e.g., Netflix, Spotify, internet, rent, electricity, SaaS, monthly retainer) and set isRecurring and recurringFrequency accordingly.',
        'For Bangladeshi mobile banking SMS:',
        '- "Cash In", "Received Money", "Payment received", "Credited", "Salary" => type: "income".',
        '- "Payment", "Send Money", "Cash Out", "Debited", "Purchased", "Bill Pay" => type: "expense".',
        'Always return a positive numeric amount. If no date is present in the input, use today\'s date.',
      ].join('\n');

      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

      if (imageBase64) {
        const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        });
      }

      parts.push({
        text: rawText
          ? `Parse this financial SMS, receipt, or itemized list into a structured transaction:\n\n${rawText}`
          : 'Extract the total transaction details from this receipt or bill image.',
      });

      const callModel = (model: string) =>
        ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts }],
          config: {
            systemInstruction,
            ...(model === 'gemini-4-hydrogen'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  enum: ['income', 'expense'],
                },
                amount: {
                  type: Type.NUMBER,
                  description: 'Positive numeric total amount of the transaction',
                },
                category: {
                  type: Type.STRING,
                  description: 'Best matching category from the allowed list',
                },
                description: {
                  type: Type.STRING,
                  description: 'Short merchant or transaction title (2 to 6 words)',
                },
                date: {
                  type: Type.STRING,
                  description: 'Transaction date in YYYY-MM-DD format',
                },
                paymentMethod: {
                  type: Type.STRING,
                  enum: PAYMENT_METHODS,
                },
                isRecurring: {
                  type: Type.BOOLEAN,
                  description: 'True if this is a subscription, utility bill, rent, or recurring payment',
                },
                recurringFrequency: {
                  type: Type.STRING,
                  enum: ['weekly', 'monthly', 'yearly'],
                },
                clientProject: {
                  type: Type.STRING,
                  description: 'Client or project name if mentioned, otherwise empty string',
                },
                notes: {
                  type: Type.STRING,
                  description: 'Concise itemized breakdown, TrxID, or reference summary',
                },
                confidenceNote: {
                  type: Type.STRING,
                  description: 'Brief 1-sentence note on what was extracted',
                },
              },
              required: ['type', 'amount', 'category', 'description', 'date', 'paymentMethod', 'isRecurring'],
            },
          },
        });

      let response;
      try {
        response = await callModel('gemini-4-hydrogen');
      } catch (primaryErr: unknown) {
        const { status } = extractReadableError(primaryErr);
        if (status === 503 || status === 429) {
          response = await callModel('gemini-3.1-flash-lite');
        } else {
          throw primaryErr;
        }
      }

      const textOut = response.text;
      if (!textOut) {
        res.status(502).json({ error: 'Gemini returned an empty response.' });
        return;
      }

      const parsed = JSON.parse(textOut);
      const txType = parsed.type === 'income' ? 'income' : 'expense';
      const validCats = txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const safeCategory = validCats.includes(parsed.category) ? parsed.category : validCats[0];
      const safeMethod = PAYMENT_METHODS.includes(parsed.paymentMethod) ? parsed.paymentMethod : 'Other';
      const safeAmount = Number(parsed.amount);

      if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
        res.status(422).json({
          error: 'Could not detect a valid transaction amount from that input. Try adding the total or clearer text.',
        });
        return;
      }

      const safeDate =
        typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
          ? parsed.date
          : today;

      res.json({
        type: txType,
        amount: Math.round(safeAmount * 100) / 100,
        category: safeCategory,
        description: String(parsed.description || 'Smart Entry').slice(0, 120),
        date: safeDate,
        paymentMethod: safeMethod,
        isRecurring: Boolean(parsed.isRecurring),
        recurringFrequency:
          parsed.isRecurring && ['weekly', 'monthly', 'yearly'].includes(parsed.recurringFrequency)
            ? parsed.recurringFrequency
            : parsed.isRecurring
            ? 'monthly'
            : undefined,
        clientProject:
          typeof parsed.clientProject === 'string' && parsed.clientProject.trim()
            ? parsed.clientProject.trim().slice(0, 80)
            : undefined,
        notes: typeof parsed.notes === 'string' ? parsed.notes.trim().slice(0, 300) : undefined,
        confidenceNote:
          typeof parsed.confidenceNote === 'string'
            ? parsed.confidenceNote.trim()
            : 'Extracted transaction fields with Gemini AI.',
      });
    } catch (error: unknown) {
      const { status, message } = extractReadableError(error);
      console.error('[AI Parse Error]', status, message);
      res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Expense server listening on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error('Failed starting server:', err);
  process.exit(1);
});
