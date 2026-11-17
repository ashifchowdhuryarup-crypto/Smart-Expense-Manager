import { SupportedCurrency, Transaction, Budget, SavingsGoal } from '../types';

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
};

export const DEFAULT_CATEGORIES = {
  income: [
    'Salary',
    'Freelance',
    'Investments',
    'Business',
    'Rental Income',
    'Bonus & Grants',
    'Gifts',
    'Other Income',
  ],
  expense: [
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
  ],
};

export const PAYMENT_METHODS = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Other',
] as const;

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency = 'BDT',
  includeSymbol: boolean = true
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '৳';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  if (!includeSymbol) return formatted;
  // BDT and INR typically precede with a space or symbol
  return `${symbol} ${formatted}`;
}

export function calculateFinancialSummary(transactions: Transaction[]) {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
    }
  }

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
  };
}

export function getTransactionsForMonth(transactions: Transaction[], yearMonth: string): Transaction[] {
  return transactions.filter(t => t.date.startsWith(yearMonth));
}

export function getLocalDateString(dateObj: Date = new Date()): string {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseTimestampValue(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const ms = Date.parse(val);
    return Number.isNaN(ms) ? 0 : ms;
  }
  if (typeof val === 'object') {
    const obj = val as { toMillis?: () => number; seconds?: number };
    if (typeof obj.toMillis === 'function') return obj.toMillis();
    if (typeof obj.seconds === 'number') return obj.seconds * 1000;
  }
  return 0;
}

export function getTransactionTimestampMs(tx: Transaction): number {
  const createdMs = parseTimestampValue(tx.createdAt);
  if (createdMs > 0) return createdMs;

  if (typeof tx.id === 'string') {
    const idMatch = tx.id.match(/^tx_(\d{10,})/);
    if (idMatch) {
      const idMs = Number(idMatch[1]);
      if (Number.isFinite(idMs) && idMs > 0) return idMs;
    }
  }

  const updatedMs = parseTimestampValue(tx.updatedAt);
  if (updatedMs > 0) return updatedMs;

  return parseTimestampValue(tx.date);
}

export function compareTransactionsNewestFirst(a: Transaction, b: Transaction): number {
  const timeDiff = getTransactionTimestampMs(b) - getTransactionTimestampMs(a);
  if (timeDiff !== 0) return timeDiff;

  const dateDiff = (b.date || '').localeCompare(a.date || '');
  if (dateDiff !== 0) return dateDiff;

  return (b.id || '').localeCompare(a.id || '');
}

export function sortTransactionsNewestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort(compareTransactionsNewestFirst);
}

export function calculateBudgetProgress(
  budget: Budget,
  monthTransactions: Transaction[]
) {
  const spent = monthTransactions
    .filter(t => t.type === 'expense' && t.category.toLowerCase() === budget.category.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0);

  const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;
  const remaining = budget.monthlyLimit - spent;
  const isOver = spent > budget.monthlyLimit;
  const isNearLimit = percentage >= 80 && !isOver;

  return {
    spent,
    remaining,
    percentage: Math.min(percentage, 100),
    actualPercentage: percentage,
    isOver,
    isNearLimit,
  };
}

export function calculateMonthlyRecurringTotal(transactions: Transaction[]): {
  monthlyExpenseTotal: number;
  monthlyIncomeTotal: number;
  recurringCount: number;
} {
  let monthlyExpenseTotal = 0;
  let monthlyIncomeTotal = 0;
  let recurringCount = 0;

  for (const t of transactions) {
    if (!t.isRecurring) continue;
    recurringCount += 1;
    let monthlyEquivalent = t.amount;
    if (t.recurringFrequency === 'weekly') {
      monthlyEquivalent = t.amount * 4.33;
    } else if (t.recurringFrequency === 'yearly') {
      monthlyEquivalent = t.amount / 12;
    }
    if (t.type === 'expense') monthlyExpenseTotal += monthlyEquivalent;
    else monthlyIncomeTotal += monthlyEquivalent;
  }

  return {
    monthlyExpenseTotal: Math.round(monthlyExpenseTotal * 100) / 100,
    monthlyIncomeTotal: Math.round(monthlyIncomeTotal * 100) / 100,
    recurringCount,
  };
}

export function calculateMonthOverMonthDelta(transactions: Transaction[]): number | null {
  const now = new Date();
  const currPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevPrefix = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  let currNet = 0;
  let prevNet = 0;
  let hasPrev = false;

  for (const t of transactions) {
    if (t.date.startsWith(currPrefix)) {
      currNet += t.type === 'income' ? t.amount : -t.amount;
    } else if (t.date.startsWith(prevPrefix)) {
      hasPrev = true;
      prevNet += t.type === 'income' ? t.amount : -t.amount;
    }
  }

  if (!hasPrev || Math.abs(prevNet) < 0.01) return null;
  return Math.round(((currNet - prevNet) / Math.abs(prevNet)) * 1000) / 10;
}

export function exportTransactionsToCSV(transactions: Transaction[], filename: string = 'smart_expenses.csv') {
  if (!transactions.length) return false;

  const headers = [
    'ID',
    'Date',
    'Type',
    'Category',
    'Description',
    'Amount',
    'Payment Method',
    'Recurring',
    'Frequency',
    'Client / Project',
    'Notes',
    'Tags',
  ];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.type.toUpperCase(),
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount,
    `"${t.paymentMethod}"`,
    t.isRecurring ? 'YES' : 'NO',
    t.isRecurring ? (t.recurringFrequency || 'monthly') : '',
    `"${(t.clientProject || '').replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    `"${(t.tags || []).join(', ')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
