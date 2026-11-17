import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  ArrowRight,
  Repeat,
  Briefcase,
  CreditCard,
  Edit2,
  Trash2,
  BarChart3,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrency,
  calculateFinancialSummary,
  calculateBudgetProgress,
  calculateMonthlyRecurringTotal,
  calculateMonthOverMonthDelta,
  getCurrentYearMonth,
  getLocalDateString,
  sortTransactionsNewestFirst,
} from '../utils/currency';
import { Transaction, TransactionType } from '../types';

interface DashboardViewProps {
  onOpenAddTransaction: (options?: { type?: TransactionType; openAI?: boolean }) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenContributeModal: (goal: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTransaction,
  onEditTransaction,
  onOpenContributeModal,
}) => {
  const { transactions, budgets, savingsGoals, currency, deleteTransaction, setActiveTab } = useFinance();
  const [hideBalance, setHideBalance] = useState(false);
  const [chartWindow, setChartWindow] = useState<'7D' | '30D' | '6M'>('30D');

  const currentMonth = getCurrentYearMonth();
  const summary = useMemo(() => calculateFinancialSummary(transactions), [transactions]);
  const recurringStats = useMemo(() => calculateMonthlyRecurringTotal(transactions), [transactions]);
  const momDelta = useMemo(() => calculateMonthOverMonthDelta(transactions), [transactions]);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  );

  const monthIncome = useMemo(
    () => monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );
  const monthExpense = useMemo(
    () => monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [monthTransactions]
  );

  // Recent Transactions (guaranteed newest added first at the top)
  const recentTransactions = useMemo(
    () => sortTransactionsNewestFirst(transactions).slice(0, 6),
    [transactions]
  );

  // Smooth Curved Area Chart Series
  const areaSeries = useMemo(() => {
    const now = new Date();
    if (chartWindow === '6M') {
      const buckets: { label: string; key: string; income: number; expense: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        buckets.push({ key, label, income: 0, expense: 0 });
      }
      for (const tx of transactions) {
        const prefix = tx.date.slice(0, 7);
        const bucket = buckets.find((b) => b.key === prefix);
        if (bucket) {
          if (tx.type === 'income') bucket.income += tx.amount;
          else bucket.expense += tx.amount;
        }
      }
      return buckets;
    }

    const daysCount = chartWindow === '7D' ? 7 : 30;
    const buckets: { label: string; key: string; income: number; expense: number }[] = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = getLocalDateString(d);
      const label =
        chartWindow === '7D'
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets.push({ key, label, income: 0, expense: 0 });
    }
    for (const tx of transactions) {
      const bucket = buckets.find((b) => b.key === tx.date);
      if (bucket) {
        if (tx.type === 'income') bucket.income += tx.amount;
        else bucket.expense += tx.amount;
      }
    }
    return buckets;
  }, [transactions, chartWindow]);

  // Client Project Rollup
  const projectSummary = useMemo(() => {
    const map: Record<string, { name: string; income: number; expense: number; count: number }> = {};
    for (const tx of transactions) {
      const name = tx.clientProject?.trim();
      if (!name) continue;
      if (!map[name]) map[name] = { name, income: 0, expense: 0, count: 0 };
      map[name].count += 1;
      if (tx.type === 'income') map[name].income += tx.amount;
      else map[name].expense += tx.amount;
    }
    return Object.values(map)
      .sort((a, b) => b.income + b.expense - (a.income + a.expense))
      .slice(0, 4);
  }, [transactions]);

  // Aggregate Monthly Budget Health
  const budgetHealth = useMemo(() => {
    if (budgets.length === 0) return null;
    const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
    const totalSpent = budgets.reduce((s, b) => s + calculateBudgetProgress(b, monthTransactions).spent, 0);
    if (totalLimit <= 0) return null;
    const ratio = (totalSpent / totalLimit) * 100;
    return {
      totalLimit,
      totalSpent,
      underPct: Math.round(100 - ratio),
      isOver: totalSpent > totalLimit,
    };
  }, [budgets, monthTransactions]);

  const maskValue = (val: string) => (hideBalance ? '••••••' : val);

  const areaTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="p-3 rounded-2xl glass-card-elevated text-xs space-y-1 shadow-2xl">
        <p className="font-semibold text-slate-900 dark:text-white">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} className="tabular-nums font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value, currency)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Balance Card */}
      <div className="hero-emerald-card rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden flex flex-col justify-between">
        <div className="pointer-events-none absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-400/15 blur-2xl" />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-emerald-100/80">Total Balance</span>
            <button
              type="button"
              onClick={() => setHideBalance((prev) => !prev)}
              aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-emerald-100 transition"
            >
              {hideBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            aria-label="Open analytics"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-emerald-100 transition"
            title="View Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums text-white">
              {maskValue(formatCurrency(summary.netBalance, currency))}
            </p>
            <p className="text-[11px] text-emerald-100/70 mt-1">
              {transactions.length === 0
                ? 'Ready for your first transaction or AI receipt scan'
                : `${transactions.length} synced records · ${currency}`}
            </p>
          </div>

          {momDelta !== null && (
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums ${
                  momDelta >= 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/20 text-rose-200'
                }`}
              >
                {momDelta >= 0 ? '▲' : '▼'} {Math.abs(momDelta)}%
              </span>
              <p className="text-[10px] text-emerald-100/65 mt-0.5">vs last month</p>
            </div>
          )}
        </div>
      </div>

      {/* 2-Column Bento Grid on Mobile (`grid-cols-2`), 12-Col Bento Grid on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Bento 1: Monthly Income */}
        <div className="col-span-1 lg:col-span-3 glass-card rounded-2xl sm:rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
              Month Inflow
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-2xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400 truncate">
              {maskValue(formatCurrency(monthIncome, currency))}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Total: {maskValue(formatCurrency(summary.totalIncome, currency))}
            </p>
          </div>
        </div>

        {/* Bento 2: Monthly Expense */}
        <div className="col-span-1 lg:col-span-3 glass-card rounded-2xl sm:rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
              Month Outflow
            </span>
            <div className="p-1.5 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white truncate">
              {maskValue(formatCurrency(monthExpense, currency))}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Total: {maskValue(formatCurrency(summary.totalExpense, currency))}
            </p>
          </div>
        </div>

        {/* Bento 3: Recurring Bills */}
        <div className="col-span-1 lg:col-span-3 glass-card rounded-2xl sm:rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
              Recurring / Mo
            </span>
            <div className="p-1.5 rounded-xl bg-teal-500/12 text-teal-700 dark:text-teal-400">
              <Repeat className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white truncate">
              {maskValue(formatCurrency(recurringStats.monthlyExpenseTotal, currency))}
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {recurringStats.recurringCount} active {recurringStats.recurringCount === 1 ? 'schedule' : 'schedules'}
            </p>
          </div>
        </div>

        {/* Bento 4: Savings Rate */}
        <div className="col-span-1 lg:col-span-3 glass-card rounded-2xl sm:rounded-3xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400">
              Savings Rate
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
              <PiggyBank className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-lg sm:text-2xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
              {summary.savingsRate}%
            </p>
            <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary.savingsRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bento 5: Smooth Curved Area Chart (Full 2-col span on mobile, 8-col on desktop) */}
        <div className="col-span-2 lg:col-span-8 glass-card rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Cashflow Curve</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Smooth inflow &amp; spending trajectory
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl glass-well">
              {(['7D', '30D', '6M'] as const).map((win) => (
                <button
                  key={win}
                  type="button"
                  onClick={() => setChartWindow(win)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    chartWindow === win
                      ? 'bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {win}
                </button>
              ))}
            </div>
          </div>

          <div className="h-52 sm:h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="dashExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
                />
                <Tooltip content={areaTooltip} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dashIncomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="#f43f5e"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#dashExpenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bento 6: Client Projects & Budget Health (Full 2-col span on mobile, 4-col on desktop) */}
        <div className="col-span-2 lg:col-span-4 glass-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Client Projects</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                Insights <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {projectSummary.length === 0 ? (
              <div className="p-4 rounded-2xl glass-well text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tag entries with a client or project name to track per-project cashflow.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {projectSummary.map((proj) => (
                  <div key={proj.name} className="p-2.5 rounded-2xl glass-well flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{proj.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {proj.count} {proj.count === 1 ? 'entry' : 'entries'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold tabular-nums shrink-0 ${
                        proj.income - proj.expense >= 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {proj.income - proj.expense >= 0 ? '+' : ''}
                      {formatCurrency(proj.income - proj.expense, currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Budget Health Callout matching Reference UI */}
          {budgetHealth ? (
            <button
              type="button"
              onClick={() => setActiveTab('budgets')}
              className="w-full text-left p-3.5 rounded-2xl bg-emerald-500/[0.08] dark:bg-emerald-500/[0.1] border border-emerald-500/20 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                  {budgetHealth.isOver ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {budgetHealth.isOver
                      ? `Over monthly budget by ${formatCurrency(budgetHealth.totalSpent - budgetHealth.totalLimit, currency)}`
                      : `You're ${Math.max(0, budgetHealth.underPct)}% under budget`}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatCurrency(budgetHealth.totalSpent, currency)} of {formatCurrency(budgetHealth.totalLimit, currency)}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('budgets')}
              className="w-full text-left p-3.5 rounded-2xl glass-well flex items-center justify-between gap-2 hover:border-emerald-500/35 transition"
            >
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Set a monthly category budget
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}
        </div>
      </div>

      {/* Recent Transactions (Reference-Inspired Clean Rows) */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Recent Transactions
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Latest activity across devices
            </p>
          </div>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            See all ({transactions.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/[0.1]">
            <p className="text-xs text-slate-500 dark:text-slate-400">No transactions recorded yet.</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => onOpenAddTransaction()}
                className="px-4 py-2 rounded-xl bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add First Entry
              </button>
              <button
                onClick={() => onOpenAddTransaction({ openAI: true })}
                className="px-4 py-2 rounded-xl glass-well text-emerald-700 dark:text-emerald-300 text-xs font-bold inline-flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" /> Scan Receipt or SMS
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
            {recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 px-1 sm:px-2 flex items-center justify-between gap-3 hover:bg-black/[0.025] dark:hover:bg-white/[0.03] rounded-2xl transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-200/80 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {tx.type === 'income' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1.5">
                      <span>{tx.category}</span>
                      {tx.clientProject && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            {tx.clientProject}
                          </span>
                        </>
                      )}
                      {tx.isRecurring && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5 text-teal-700 dark:text-teal-300 font-medium">
                            <Repeat className="w-2.5 h-2.5" />
                            {tx.recurringFrequency || 'monthly'}
                          </span>
                        </>
                      )}
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <CreditCard className="w-2.5 h-2.5" /> {tx.paymentMethod}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-xs sm:text-sm font-extrabold tabular-nums block ${
                        tx.type === 'income'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 tabular-nums">
                      {tx.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      aria-label="Edit transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      aria-label="Delete transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
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

      {/* Savings Targets Row (shown compactly when user has goals) */}
      {savingsGoals.length > 0 && (
        <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Savings Targets</h2>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {savingsGoals.slice(0, 3).map((goal) => {
              const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              return (
                <div key={goal.id} className="p-3.5 rounded-2xl glass-well space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{goal.title}</span>
                    <button
                      onClick={() => onOpenContributeModal(goal)}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition shrink-0"
                    >
                      + Deposit
                    </button>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: goal.color || '#10b981' }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>{formatCurrency(goal.currentAmount, currency)}</span>
                    <span>{percent}% of {formatCurrency(goal.targetAmount, currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
