import React, { useState, useEffect } from 'react';
import { X, Target } from 'lucide-react';
import { Budget } from '../types';
import { DEFAULT_CATEGORIES, getCurrentYearMonth, formatCurrency } from '../utils/currency';
import { useFinance } from '../context/FinanceContext';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBudget?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  initialBudget,
}) => {
  const { addBudget, updateBudget, currency } = useFinance();

  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES.expense[0]);
  const [monthlyLimit, setMonthlyLimit] = useState<string>('');
  const [month, setMonth] = useState<string>(getCurrentYearMonth());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialBudget) {
      setCategory(initialBudget.category);
      setMonthlyLimit(String(initialBudget.monthlyLimit));
      setMonth(initialBudget.month);
    } else {
      setCategory(DEFAULT_CATEGORIES.expense[0]);
      setMonthlyLimit('');
      setMonth(getCurrentYearMonth());
    }
    setError(null);
  }, [initialBudget, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) {
      setError('Please enter a valid monthly budget limit.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (initialBudget) {
        await updateBudget({
          ...initialBudget,
          category,
          monthlyLimit: limit,
          month,
        });
      } else {
        await addBudget({
          category,
          monthlyLimit: limit,
          month,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl glass-card-elevated p-6 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {initialBudget ? 'Edit Category Budget' : 'Set Monthly Budget'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Control and track category expenditure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            >
              {DEFAULT_CATEGORIES.expense.map((cat) => (
                <option key={cat} value={cat} className="bg-white dark:bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Monthly Limit ({currency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="e.g. 15000"
                required
                className="w-full pl-4 pr-16 py-3 rounded-xl glass-well text-slate-900 dark:text-white text-base font-extrabold tabular-nums placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                {currency}
              </div>
            </div>
            {monthlyLimit && !isNaN(parseFloat(monthlyLimit)) && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Limit:{' '}
                <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                  {formatCurrency(parseFloat(monthlyLimit), currency)}
                </span>{' '}
                / month
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Month *
            </label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialBudget ? 'Update Budget' : 'Set Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
