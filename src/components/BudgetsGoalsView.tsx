import React from 'react';
import {
  Target,
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  PlusCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Budget, SavingsGoal } from '../types';
import {
  formatCurrency,
  calculateBudgetProgress,
  getCurrentYearMonth,
} from '../utils/currency';

interface BudgetsGoalsViewProps {
  onOpenAddBudget: () => void;
  onEditBudget: (b: Budget) => void;
  onOpenAddGoal: () => void;
  onEditGoal: (g: SavingsGoal) => void;
  onOpenContributeModal: (g: SavingsGoal) => void;
}

export const BudgetsGoalsView: React.FC<BudgetsGoalsViewProps> = ({
  onOpenAddBudget,
  onEditBudget,
  onOpenAddGoal,
  onEditGoal,
  onOpenContributeModal,
}) => {
  const {
    budgets,
    savingsGoals,
    transactions,
    currency,
    deleteBudget,
    deleteSavingsGoal,
  } = useFinance();

  const currentMonth = getCurrentYearMonth();
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => {
    const prog = calculateBudgetProgress(b, monthTransactions);
    return sum + prog.spent;
  }, 0);
  const totalBudgetPercent =
    totalBudgetLimit > 0 ? Math.min(100, Math.round((totalBudgetSpent / totalBudgetLimit) * 100)) : 0;

  const totalGoalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalGoalPercent =
    totalGoalTarget > 0 ? Math.min(100, Math.round((totalGoalSaved / totalGoalTarget) * 100)) : 0;

  return (
    <div className="space-y-8">
      {/* SECTION 1: MONTHLY BUDGETS */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Monthly Category Budgets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Expense thresholds and alerts for {currentMonth}
            </p>
          </div>

          <button
            onClick={onOpenAddBudget}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#103b2a] hover:bg-[#165039] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Set Category Budget
          </button>
        </div>

        {budgets.length > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl glass-card space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Monthly Budget Allocation</span>
              <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                {formatCurrency(totalBudgetSpent, currency)} / {formatCurrency(totalBudgetLimit, currency)}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  totalBudgetSpent > totalBudgetLimit ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${totalBudgetPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{totalBudgetPercent}% allocated spent</span>
              <span className="tabular-nums font-semibold">
                {totalBudgetLimit >= totalBudgetSpent ? (
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(totalBudgetLimit - totalBudgetSpent, currency)} left
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">
                    {formatCurrency(totalBudgetSpent - totalBudgetLimit, currency)} over total
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {budgets.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl glass-card border-dashed">
            <Target className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No category budgets yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add spending limits for categories like Groceries, Dining, and Transport to avoid overspending.
            </p>
            <button
              onClick={onOpenAddBudget}
              className="mt-3 px-4 py-2 rounded-xl bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold transition"
            >
              Add First Budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.map((b) => {
              const prog = calculateBudgetProgress(b, monthTransactions);
              return (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl glass-card space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{b.category}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Month: {b.month}</p>
                    </div>

                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEditBudget(b)}
                        aria-label="Edit budget"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBudget(b.id)}
                        aria-label="Delete budget"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Spent:</span>
                      <span className="font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(prog.spent, currency)}{' '}
                        <span className="text-slate-400 dark:text-slate-500 font-normal">
                          / {formatCurrency(b.monthlyLimit, currency)}
                        </span>
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          prog.isOver ? 'bg-rose-500' : prog.isNearLimit ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${prog.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {prog.isOver ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Over by {formatCurrency(Math.abs(prog.remaining), currency)}
                      </span>
                    ) : prog.isNearLimit ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {Math.round(prog.actualPercentage)}% spent (Warning)
                      </span>
                    ) : (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {formatCurrency(prog.remaining, currency)} remaining
                      </span>
                    )}

                    <span className="font-bold tabular-nums text-slate-700 dark:text-slate-300">
                      {Math.round(prog.actualPercentage)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2: SAVINGS GOALS */}
      <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Savings Targets &amp; Goals
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Accumulate savings for emergencies, gadgets, travel, and investments
            </p>
          </div>

          <button
            onClick={onOpenAddGoal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#103b2a] hover:bg-[#165039] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Savings Goal
          </button>
        </div>

        {savingsGoals.length > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl glass-card space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Savings Target Progress</span>
              <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatCurrency(totalGoalSaved, currency)} / {formatCurrency(totalGoalTarget, currency)}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-2.5 overflow-hidden">
              <div
                className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${totalGoalPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{totalGoalPercent}% overall progress</span>
              <span className="tabular-nums">{formatCurrency(Math.max(0, totalGoalTarget - totalGoalSaved), currency)} to go</span>
            </div>
          </div>
        )}

        {savingsGoals.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl glass-card border-dashed">
            <PiggyBank className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No savings targets yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Start building your emergency fund or saving up for your next milestone.
            </p>
            <button
              onClick={onOpenAddGoal}
              className="mt-3 px-4 py-2 rounded-xl bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold transition"
            >
              Set First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savingsGoals.map((goal) => {
              const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const isCompleted = goal.currentAmount >= goal.targetAmount;

              return (
                <div
                  key={goal.id}
                  className="p-5 rounded-3xl glass-card space-y-3.5 relative group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: goal.color || '#10b981' }}
                        />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{goal.title}</h4>
                      </div>

                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEditGoal(goal)}
                          aria-label="Edit goal"
                          className="p-1 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSavingsGoal(goal.id)}
                          aria-label="Delete goal"
                          className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        Saved: <strong className="text-slate-900 dark:text-white tabular-nums">{formatCurrency(goal.currentAmount, currency)}</strong>
                      </span>
                      <span>
                        Target: <strong className="tabular-nums">{formatCurrency(goal.targetAmount, currency)}</strong>
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color || '#10b981',
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">{percent}% Achieved</span>
                      {goal.targetDate && <span>Due: {goal.targetDate}</span>}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isCompleted ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Goal Reached!
                        </span>
                      ) : (
                        <span className="tabular-nums">{formatCurrency(goal.targetAmount - goal.currentAmount, currency)} remaining</span>
                      )}
                    </span>

                    <button
                      onClick={() => onOpenContributeModal(goal)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Deposit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
