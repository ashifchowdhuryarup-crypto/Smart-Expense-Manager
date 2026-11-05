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

export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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

export function exportTransactionsToCSV(transactions: Transaction[], filename: string = 'smart_expenses.csv') {
  if (!transactions.length) return false;

  const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes', 'Tags'];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.type.toUpperCase(),
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount,
    `"${t.paymentMethod}"`,
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

