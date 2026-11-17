import { PaymentMethod, RecurringFrequency, TransactionType } from '../types';
import { getLocalDateString } from '../utils/currency';

export interface ParsedAIEntry {
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  clientProject?: string;
  notes?: string;
  confidenceNote?: string;
}

export async function parseSmartEntryWithAI(payload: {
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  currency?: string;
  knownProjects?: string[];
}): Promise<ParsedAIEntry> {
  const response = await fetch('/api/ai/parse-entry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      today: getLocalDateString(),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `AI parsing failed (${response.status})`);
  }

  return data as ParsedAIEntry;
}
