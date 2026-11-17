import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Repeat,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrency,
  calculateBudgetProgress,
  calculateMonthlyRecurringTotal,
  getCurrentYearMonth,
  getLocalDateString,
} from '../utils/currency';

const RING_COLORS = [
  '#103b2a',
  '#10b981',
  '#34d399',
  '#6ee7b7',
  '#14b8a6',
  '#64748b',
  '#94a3b8',
  '#cbd5e1',
];

type AnalyticsFocus = 'spending' | 'income' | 'projects' | 'recurring';

export const AnalyticsView: React.FC = () => {
  const { transactions, budgets, currency, setActiveTab } = useFinance();
  const [timeframe, setTimeframe] = useState<'30days' | '6months' | 'all'>('all');
  const [focusTab, setFocusTab] = useState<AnalyticsFocus>('spending');

  const currentMonth = getCurrentYearMonth();
  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  );

  const filteredTxs = useMemo(() => {
    if (timeframe === 'all') return transactions;
    const now = new Date();
    const days = timeframe === '30days' ? 30 : 180;
    const cutoff = getLocalDateString(new Date(now.getTime() - days * 86400000));
    return transactions.filter((t) => t.date >= cutoff);
  }, [transactions, timeframe]);

  // Smooth Curved Area Chart Timeline
  const monthlyTimeline = useMemo(() => {
    if (filteredTxs.length === 0) return [];

    if (timeframe === '30days') {
      const days: Array<{ month: string; income: number; expense: number }> = [];
      const now = new Date();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = getLocalDateString(d);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const dayTxs = filteredTxs.filter((t) => t.date === key);
        days.push({
          month: label,
          income: dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        });
      }
      return days;
    }

    const map: Record<string, { month: string; income: number; expense: number }> = {};
    for (const t of filteredTxs) {
      const month = t.date.substring(0, 7);
      if (!map[month]) map[month] = { month, income: 0, expense: 0 };
      if (t.type === 'income') map[month].income += t.amount;
      else map[month].expense += t.amount;
    }

    const sortedMonths = Object.keys(map).sort();
    if (sortedMonths.length > 0 && sortedMonths.length < 4) {
      const [y, m] = sortedMonths[sortedMonths.length - 1].split('-').map(Number);
      for (let i = 3; i >= 0; i--) {
        const d = new Date(y, m - 1 - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
      }
    }

    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTxs, timeframe]);

  // Donut Dataset driven by focusTab
  const donutData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filteredTxs) {
      if (focusTab === 'spending' && t.type === 'expense') {
        map[t.category] = (map[t.category] || 0) + t.amount;
      } else if (focusTab === 'income' && t.type === 'income') {
        map[t.category] = (map[t.category] || 0) + t.amount;
      } else if (focusTab === 'projects' && t.clientProject) {
        map[t.clientProject] = (map[t.clientProject] || 0) + t.amount;
      } else if (focusTab === 'recurring' && t.isRecurring) {
        map[t.description] = (map[t.description] || 0) + t.amount;
      }
    }
    const list = Object.entries(map).map(([name, value]) => ({ name, value }));
    const total = list.reduce((s, item) => s + item.value, 0);
    return {
      items: list.sort((a, b) => b.value - a.value),
      total,
    };
  }, [filteredTxs, focusTab]);

  // Payment Channels
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filteredTxs) {
      map[t.paymentMethod] = (map[t.paymentMethod] || 0) + t.amount;
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  // Recurring & Project Totals
  const recurringStats = useMemo(() => calculateMonthlyRecurringTotal(filteredTxs), [filteredTxs]);
  const totalIncome = filteredTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Budget Health Banner (matching Reference UI)
  const budgetBanner = useMemo(() => {
    if (budgets.length === 0) return null;
    const totalLimit = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
    const totalSpent = budgets.reduce((s, b) => s + calculateBudgetProgress(b, monthTransactions).spent, 0);
    if (totalLimit <= 0) return null;
    const pct = Math.round(((totalLimit - totalSpent) / totalLimit) * 100);
    return {
      isOver: totalSpent > totalLimit,
      pct: Math.abs(pct),
      diff: Math.abs(totalLimit - totalSpent),
    };
  }, [budgets, monthTransactions]);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-2xl glass-card-elevated text-xs space-y-1 shadow-2xl">
          {label && <p className="font-semibold text-slate-900 dark:text-white">{label}</p>}
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="tabular-nums font-semibold"
              style={{ color: entry.color || entry.stroke || entry.fill || '#10b981' }}
            >
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const focusLabel =
    focusTab === 'spending'
      ? 'Total Spent'
      : focusTab === 'income'
      ? 'Total Earned'
      : focusTab === 'projects'
      ? 'Project Volume'
      : 'Recurring Total';

  return (
    <div className="space-y-5">
      {/* Header & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cashflow curves, category breakdowns, recurring bills &amp; client projects
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl glass-card self-start sm:self-auto">
          {(['30days', '6months', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                timeframe === period
                  ? 'bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {period === 'all' ? 'All Time' : period === '6months' ? '6 Months' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Reference-Inspired Segmented Focus Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl glass-card">
        {(
          [
            { id: 'spending', label: 'Spending' },
            { id: 'income', label: 'Income' },
            { id: 'projects', label: 'Projects' },
            { id: 'recurring', label: 'Recurring' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFocusTab(tab.id)}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition ${
              focusTab === tab.id
                ? 'bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2-Col Mobile Bento Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Inflow</span>
            <p className="text-base sm:text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400 truncate">
              {formatCurrency(totalIncome, currency)}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Outflow</span>
            <p className="text-base sm:text-xl font-extrabold tabular-nums text-rose-600 dark:text-rose-400 truncate">
              {formatCurrency(totalExpense, currency)}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400 shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Recurring / Mo</span>
            <p className="text-base sm:text-xl font-extrabold tabular-nums text-slate-900 dark:text-white truncate">
              {formatCurrency(recurringStats.monthlyExpenseTotal, currency)}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-teal-500/12 text-teal-700 dark:text-teal-400 shrink-0">
            <Repeat className="w-4 h-4" />
          </div>
        </div>

        <div className="glass-card rounded-2xl sm:rounded-3xl p-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Tagged Projects</span>
            <p className="text-base sm:text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {
                new Set(
                  filteredTxs
                    .map((t) => t.clientProject?.trim())
                    .filter((v): v is string => Boolean(v))
                ).size
              }
            </p>
          </div>
          <div className="p-2 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Analytics Bento: Donut Ring + Smooth Curved Area Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Reference-Inspired Donut Breakdown with Centered Total */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {focusTab.charAt(0).toUpperCase() + focusTab.slice(1)} Breakdown
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Share across {donutData.items.length || 0} groups
              </p>
            </div>
          </div>

          <div className="relative h-56 w-full">
            {donutData.items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center px-4">
                No {focusTab} entries recorded in this timeframe yet.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData.items}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {donutData.items.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={RING_COLORS[index % RING_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={customTooltip} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centered Donut Total */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                  <span className="text-lg sm:text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(donutData.total, currency)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{focusLabel}</span>
                </div>
              </>
            )}
          </div>

          {/* 2-Column Legend matching Reference UI */}
          {donutData.items.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
              {donutData.items.slice(0, 6).map((item, idx) => {
                const pct = donutData.total > 0 ? Math.round((item.value / donutData.total) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: RING_COLORS[idx % RING_COLORS.length] }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold tabular-nums text-slate-900 dark:text-white shrink-0">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Budget Callout Banner */}
          {budgetBanner && (
            <button
              type="button"
              onClick={() => setActiveTab('budgets')}
              className="w-full text-left p-3.5 rounded-2xl bg-emerald-500/[0.08] dark:bg-emerald-500/[0.1] border border-emerald-500/20 flex items-center gap-3 hover:border-emerald-500/40 transition"
            >
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 shrink-0">
                {budgetBanner.isOver ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {budgetBanner.isOver
                    ? `You're over budget by ${formatCurrency(budgetBanner.diff, currency)}`
                    : `You're ${budgetBanner.pct}% under budget!`}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {budgetBanner.isOver
                    ? 'Review category spending limits in Budgets.'
                    : 'Great job managing your spending this month.'}
                </p>
              </div>
            </button>
          )}
        </div>

        {/* Smooth Curved Area Chart + Payment Channel Bar Chart */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          <div className="glass-card rounded-3xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Smooth Cashflow Trend
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Monthly income vs expense area curve
              </p>
            </div>

            <div className="h-64 w-full">
              {monthlyTimeline.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                  Not enough monthly records to render curve
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTimeline} margin={{ top: 10, right: 10, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="analyticsExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.38} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
                    />
                    <Tooltip content={customTooltip} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#analyticsIncomeGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expense"
                      stroke="#f43f5e"
                      strokeWidth={2.2}
                      fillOpacity={1}
                      fill="url(#analyticsExpenseGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Payment Channels
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Volume processed across bKash, Nagad, cards, bank &amp; cash
              </p>
            </div>

            <div className="h-52 w-full">
              {paymentMethodData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                  No transactions to display
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentMethodData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
                    />
                    <Tooltip content={customTooltip} />
                    <Bar dataKey="value" name="Volume" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
