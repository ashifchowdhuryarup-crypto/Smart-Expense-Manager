import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatCurrency,
  calculateFinancialSummary,
  calculateBudgetProgress,
  CURRENCY_SYMBOLS,
} from './currency';
import { Transaction, Budget } from '../types';

test('formatCurrency correctly formats with BDT symbol', () => {
  const result = formatCurrency(12500, 'BDT');
  assert.equal(result, '৳ 12,500');
  assert.equal(CURRENCY_SYMBOLS.BDT, '৳');
});

test('formatCurrency formats USD and decimal fractions correctly', () => {
  const result = formatCurrency(450.75, 'USD');
  assert.equal(result, '$ 450.75');
});

test('calculateFinancialSummary computes income, expense, balance, and savings rate', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      userId: 'u1',
      type: 'income',
      amount: 100000,
      category: 'Salary',
      description: 'Job salary',
      date: '2026-11-01',
      paymentMethod: 'Bank Transfer',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-01',
    },
    {
      id: '2',
      userId: 'u1',
      type: 'expense',
      amount: 30000,
      category: 'Rent',
      description: 'Rent',
      date: '2026-11-02',
      paymentMethod: 'Bank Transfer',
      createdAt: '2026-11-02',
      updatedAt: '2026-11-02',
    },
    {
      id: '3',
      userId: 'u1',
      type: 'expense',
      amount: 10000,
      category: 'Food',
      description: 'Food',
      date: '2026-11-03',
      paymentMethod: 'Cash',
      createdAt: '2026-11-03',
      updatedAt: '2026-11-03',
    },
  ];

  const summary = calculateFinancialSummary(mockTransactions);
  assert.equal(summary.totalIncome, 100000);
  assert.equal(summary.totalExpense, 40000);
  assert.equal(summary.netBalance, 60000);
  // (100000 - 40000) / 100000 = 60%
  assert.equal(summary.savingsRate, 60);
});

test('calculateBudgetProgress accurately marks within budget vs near limit vs over budget', () => {
  const budget: Budget = {
    id: 'b1',
    userId: 'u1',
    category: 'Groceries',
    monthlyLimit: 10000,
    month: '2026-11',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
  };

  const withinLimitTx: Transaction[] = [
    {
      id: 't1',
      userId: 'u1',
      type: 'expense',
      amount: 4000,
      category: 'Groceries',
      description: 'Supermarket',
      date: '2026-11-05',
      paymentMethod: 'Cash',
      createdAt: '2026-11-05',
      updatedAt: '2026-11-05',
    },
  ];

  const progress1 = calculateBudgetProgress(budget, withinLimitTx);
  assert.equal(progress1.spent, 4000);
  assert.equal(progress1.percentage, 40);
  assert.equal(progress1.isOver, false);
  assert.equal(progress1.isNearLimit, false);

  const nearLimitTx: Transaction[] = [
    ...withinLimitTx,
    {
      id: 't2',
      userId: 'u1',
      type: 'expense',
      amount: 4500,
      category: 'Groceries',
      description: 'Extra items',
      date: '2026-11-06',
      paymentMethod: 'Cash',
      createdAt: '2026-11-06',
      updatedAt: '2026-11-06',
    },
  ];

  const progress2 = calculateBudgetProgress(budget, nearLimitTx);
  assert.equal(progress2.spent, 8500);
  assert.equal(progress2.percentage, 85);
  assert.equal(progress2.isOver, false);
  assert.equal(progress2.isNearLimit, true);

  const overLimitTx: Transaction[] = [
    ...nearLimitTx,
    {
      id: 't3',
      userId: 'u1',
      type: 'expense',
      amount: 2000,
      category: 'Groceries',
      description: 'Over budget item',
      date: '2026-11-07',
      paymentMethod: 'Cash',
      createdAt: '2026-11-07',
      updatedAt: '2026-11-07',
    },
  ];

  const progress3 = calculateBudgetProgress(budget, overLimitTx);
  assert.equal(progress3.spent, 10500);
  assert.equal(progress3.isOver, true);
  assert.equal(progress3.remaining, -500);
});
