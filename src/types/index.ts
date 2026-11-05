export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'Cash' 
  | 'Bank Transfer' 
  | 'Credit Card' 
  | 'Debit Card' 
  | 'bKash' 
  | 'Nagad' 
  | 'Rocket' 
  | 'Other';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date format YYYY-MM-DD
  paymentMethod: PaymentMethod;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  syncedToCloud?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export type SupportedCurrency = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR';

export interface UserSettings {
  id: string;
  userId: string;
  currency: SupportedCurrency;
  theme: 'dark' | 'light' | 'system';
  monthlyIncomeTarget?: number;
  updatedAt: string;
}

export interface SyncQueueItem {
  id: string;
  collection: 'transactions' | 'budgets' | 'savingsGoals' | 'settings';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

export type ViewTab = 'dashboard' | 'transactions' | 'budgets' | 'analytics' | 'settings';
