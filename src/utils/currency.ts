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

export function getInitialDemoData(userId: string = 'demo-user'): {
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
} {
  const currentMonth = getCurrentYearMonth();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      userId,
      type: 'income',
      amount: 85000,
      category: 'Salary',
      description: 'Monthly Tech Salary',
      date: today,
      paymentMethod: 'Bank Transfer',
      notes: 'Direct company payroll deposit',
      tags: ['salary', 'primary'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    },
    {
      id: 'tx-2',
      userId,
      type: 'income',
      amount: 18000,
      category: 'Freelance',
      description: 'UI Design Consultation',
      date: yesterday,
      paymentMethod: 'bKash',
      notes: 'Client payment for dashboard design',
      tags: ['freelance', 'client'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    },
    {
      id: 'tx-3',
      userId,
      type: 'expense',
      amount: 22000,
      category: 'Housing & Rent',
      description: 'Apartment monthly rent',
      date: today,
      paymentMethod: 'Bank Transfer',
      notes: 'Paid to landlord',
      tags: ['fixed', 'rent'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    },
    {
      id: 'tx-4',
      userId,
      type: 'expense',
      amount: 6500,
      category: 'Groceries',
      description: 'Weekly Supermarket run',
      date: yesterday,
      paymentMethod: 'Credit Card',
      notes: 'Fresh produce, dairy and pantry essentials',
      tags: ['food', 'home'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    },
    {
      id: 'tx-5',
      userId,
      type: 'expense',
      amount: 1850,
      category: 'Food & Dining',
      description: 'Dinner with colleagues',
      date: lastWeek,
      paymentMethod: 'bKash',
      notes: 'Biryani house dinner',
      tags: ['dining', 'friends'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    },
    {
      id: 'tx-6',
      userId,
      type: 'expense',
      amount: 2400,
      category: 'Utilities & Internet',
      description: 'High-speed Fiber Broadband bill',
      date: lastWeek,
      paymentMethod: 'Nagad',
      notes: 'Monthly 50Mbps subscription',
      tags: ['utilities'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    },
    {
      id: 'tx-7',
      userId,
      type: 'expense',
      amount: 3200,
      category: 'Transportation',
      description: 'Ride shares and fuel refill',
      date: today,
      paymentMethod: 'Cash',
      notes: 'Commute and rides',
      tags: ['commute'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    },
  ];

  const budgets: Budget[] = [
    {
      id: 'bg-1',
      userId,
      category: 'Groceries',
      monthlyLimit: 15000,
      month: currentMonth,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bg-2',
      userId,
      category: 'Food & Dining',
      monthlyLimit: 8000,
      month: currentMonth,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bg-3',
      userId,
      category: 'Housing & Rent',
      monthlyLimit: 25000,
      month: currentMonth,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bg-4',
      userId,
      category: 'Transportation',
      monthlyLimit: 6000,
      month: currentMonth,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const goals: SavingsGoal[] = [
    {
      id: 'sg-1',
      userId,
      title: 'Emergency Rainy Day Fund',
      targetAmount: 150000,
      currentAmount: 95000,
      targetDate: '2026-12-31',
      category: 'Security',
      color: '#10b981',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sg-2',
      userId,
      title: 'New High-End Workstation',
      targetAmount: 180000,
      currentAmount: 120000,
      targetDate: '2026-12-15',
      category: 'Tech Gadgets',
      color: '#6366f1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sg-3',
      userId,
      title: 'Annual Vacation Trip',
      targetAmount: 60000,
      currentAmount: 25000,
      targetDate: '2027-02-28',
      category: 'Travel',
      color: '#f59e0b',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return { transactions, budgets, goals };
}
