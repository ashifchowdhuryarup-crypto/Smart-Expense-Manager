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
  '#10b981', // emerald
  '#6366f1', // indigo
  '#38bdf8', // sky
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
];

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  initialGoal,
  mode = 'createOrEdit',
}) => {
  const { addSavingsGoal, updateSavingsGoal, addGoalContribution, currency } = useFinance();

  // Create / Edit state
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('General');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  // Contribution state
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
      // Default target date: 6 months in the future
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              {mode === 'contribute' ? <PlusCircle className="w-5 h-5" /> : <PiggyBank className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">
                {mode === 'contribute'
                  ? `Deposit to "${initialGoal?.title}"`
                  : initialGoal
                  ? 'Edit Savings Goal'
                  : 'New Savings Target'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'contribute' ? 'Add funds towards this goal' : 'Track milestones and contributions'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'contribute' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                    className="w-full pl-4 pr-16 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-base font-bold placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    {currency}
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                {[500, 1000, 5000, 10000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setContributionAmount(String(preset))}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                  >
                    +{formatCurrency(preset, currency, false)}
                  </button>
                ))}
              </div>

              {initialGoal && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Current saved:</span>
                    <span className="font-semibold text-white">{formatCurrency(initialGoal.currentAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target:</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(initialGoal.targetAmount, currency)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Emergency Fund, New Laptop, Vacation"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Already Saved
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Security, Tech..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                        color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50"
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
