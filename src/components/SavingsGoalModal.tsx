import React, { useState, useEffect } from 'react';
import { X, PiggyBank, PlusCircle } from 'lucide-react';
import { SavingsGoal } from '../types';
import { formatCurrency } from '../utils/currency';
import { useFinance } from '../context/FinanceContext';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: SavingsGoal | null;
  mode?: 'createOrEdit' | 'contribute';
}

const PRESET_COLORS = [
  '#10b981',
  '#103b2a',
  '#14b8a6',
  '#f59e0b',
  '#06b6d4',
  '#8b5cf6',
];

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  initialGoal,
  mode = 'createOrEdit',
}) => {
  const { addSavingsGoal, updateSavingsGoal, addGoalContribution, currency } = useFinance();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('General');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const [contributionAmount, setContributionAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialGoal) {
      setTitle(initialGoal.title);
      setTargetAmount(String(initialGoal.targetAmount));
      setCurrentAmount(String(initialGoal.currentAmount));
      setTargetDate(initialGoal.targetDate || '');
      setCategory(initialGoal.category || 'General');
      setColor(initialGoal.color || PRESET_COLORS[0]);
    } else {
      setTitle('');
      setTargetAmount('');
      setCurrentAmount('0');
      const future = new Date();
      future.setMonth(future.getMonth() + 6);
      setTargetDate(future.toISOString().split('T')[0]);
      setCategory('General');
      setColor(PRESET_COLORS[0]);
    }
    setContributionAmount('');
    setError(null);
  }, [initialGoal, isOpen, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'contribute' && initialGoal) {
      const amount = parseFloat(contributionAmount);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid contribution amount.');
        return;
      }
      try {
        setIsSubmitting(true);
        await addGoalContribution(initialGoal.id, amount);
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Failed to deposit contribution.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;

    if (!title.trim()) {
      setError('Please provide a goal name.');
      return;
    }

    if (isNaN(target) || target <= 0) {
      setError('Please enter a valid target amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (initialGoal) {
        await updateSavingsGoal({
          ...initialGoal,
          title: title.trim(),
          targetAmount: target,
          currentAmount: current,
          targetDate,
          category,
          color,
        });
      } else {
        await addSavingsGoal({
          title: title.trim(),
          targetAmount: target,
          currentAmount: current,
          targetDate,
          category,
          color,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save savings goal.');
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
              {mode === 'contribute' ? <PlusCircle className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {mode === 'contribute'
                  ? `Deposit to "${initialGoal?.title}"`
                  : initialGoal
                  ? 'Edit Savings Goal'
                  : 'New Savings Target'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'contribute' ? 'Add funds towards this goal' : 'Track milestones and contributions'}
              </p>
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
          {mode === 'contribute' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Contribution Amount ({currency}) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    required
                    autoFocus
                    className="w-full pl-4 pr-16 py-3 rounded-xl glass-well text-slate-900 dark:text-white text-base font-extrabold tabular-nums placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                    {currency}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[500, 1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setContributionAmount(String(preset))}
                    className="flex-1 py-1.5 rounded-xl glass-well hover:border-emerald-500/40 text-xs text-slate-700 dark:text-slate-200 font-semibold tabular-nums transition"
                  >
                    +{formatCurrency(preset, currency, false)}
                  </button>
                ))}
              </div>

              {initialGoal && (
                <div className="p-3.5 rounded-2xl glass-well text-xs space-y-1">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Current saved:</span>
                    <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(initialGoal.currentAmount, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Target:</span>
                    <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(initialGoal.targetAmount, currency)}
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Emergency Fund, New Laptop, Vacation"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="100000"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm font-bold tabular-nums focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Already Saved
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm font-bold tabular-nums focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Security, Tech..."
                    className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : 'opacity-75 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

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
              {isSubmitting
                ? 'Saving...'
                : mode === 'contribute'
                ? 'Confirm Deposit'
                : initialGoal
                ? 'Update Goal'
                : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
