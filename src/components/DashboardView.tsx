import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrency,
  calculateFinancialSummary,
  calculateBudgetProgress,
  getCurrentYearMonth,
} from '../utils/currency';
import { Transaction } from '../types';

interface DashboardViewProps {
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenContributeModal: (goal: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTransaction,
  onEditTransaction,
  onOpenContributeModal,
}) => {
  const { transactions, budgets, savingsGoals, currency, deleteTransaction, setActiveTab } = useFinance();

  const currentMonth = getCurrentYearMonth();
  const summary = calculateFinancialSummary(transactions);

  // Month transactions
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking expenses in <span className="text-emerald-400 font-semibold">{currency}</span> across offline & cloud devices
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Transaction
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Balance */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Net Balance</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight text-white">
              {formatCurrency(summary.netBalance, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              {summary.netBalance >= 0 ? (
                <span className="text-emerald-400 font-medium flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" /> Positive cashflow
                </span>
              ) : (
                <span className="text-rose-400 font-medium flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" /> Deficit warning
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Income</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight text-emerald-400">
              {formatCurrency(summary.totalIncome, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              From {transactions.filter((t) => t.type === 'income').length} earnings records
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Expenses</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight text-rose-400">
              {formatCurrency(summary.totalExpense, currency)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              From {transactions.filter((t) => t.type === 'expense').length} spending items
            </p>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Savings Rate</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tracking-tight text-amber-400">
              {summary.savingsRate}%
            </p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary.savingsRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Category Budgets Status & Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Budgets Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Active Category Budgets</h2>
              <p className="text-[11px] text-slate-400">Expenditure caps for {currentMonth}</p>
            </div>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {budgets.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800">
              <p className="text-xs text-slate-400">No category budgets defined for this month.</p>
              <button
                onClick={() => setActiveTab('budgets')}
                className="mt-2 text-xs text-indigo-400 font-semibold hover:underline"
              >
                Set your first budget limit
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.slice(0, 4).map((b) => {
                const prog = calculateBudgetProgress(b, monthTransactions);
                return (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{b.category}</span>
                      <span className="text-slate-400 text-[11px]">
                        {formatCurrency(prog.spent, currency)} / <span className="text-slate-200">{formatCurrency(b.monthlyLimit, currency)}</span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          prog.isOver ? 'bg-rose-500' : prog.isNearLimit ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${prog.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      {prog.isOver ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Over budget by {formatCurrency(Math.abs(prog.remaining), currency)}
                        </span>
                      ) : prog.isNearLimit ? (
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Approaching cap ({Math.round(prog.actualPercentage)}%)
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {formatCurrency(prog.remaining, currency)} remaining
                        </span>
                      )}
                      <span className="text-slate-400">{Math.round(prog.actualPercentage)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Savings Goals Status */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Savings Targets</h2>
              <p className="text-[11px] text-slate-400">Goals and active contributions</p>
            </div>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {savingsGoals.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-800">
              <p className="text-xs text-slate-400">No savings targets created yet.</p>
              <button
                onClick={() => setActiveTab('budgets')}
                className="mt-2 text-xs text-emerald-400 font-semibold hover:underline"
              >
                Create a savings target
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savingsGoals.slice(0, 3).map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: goal.color || '#10b981' }}
                        />
                        <span className="text-xs font-semibold text-slate-200">{goal.title}</span>
                      </div>
                      <button
                        onClick={() => onOpenContributeModal(goal)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition"
                      >
                        + Deposit
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Saved: <strong className="text-white">{formatCurrency(goal.currentAmount, currency)}</strong></span>
                      <span>Target: <strong className="text-slate-200">{formatCurrency(goal.targetAmount, currency)}</strong></span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color || '#10b981',
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>{percent}% Completed</span>
                      {goal.targetDate && <span>Target: {goal.targetDate}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions List */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <p className="text-[11px] text-slate-400">Latest recorded income & expenses</p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            All records ({transactions.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800">
            <p className="text-xs text-slate-400">No transactions recorded yet.</p>
            <button
              onClick={onOpenAddTransaction}
              className="mt-2 text-xs text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add your first transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80 overflow-x-auto">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-800/40 rounded-xl transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {tx.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-2.5 h-2.5" /> {tx.paymentMethod}
                      </span>
                      <span>•</span>
                      <span>{tx.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-sm font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                  </span>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      aria-label="Edit transaction"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      aria-label="Delete transaction"
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
