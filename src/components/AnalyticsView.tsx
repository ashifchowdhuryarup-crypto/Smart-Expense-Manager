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
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/currency';

const PIE_COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#38bdf8', // sky
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#eab308', // yellow
  '#64748b', // slate
];

export const AnalyticsView: React.FC = () => {
  const { transactions, currency } = useFinance();
  const [timeframe, setTimeframe] = useState<'all' | '6months' | '30days'>('all');

  // Filtered transactions for analytics
  const filteredTxs = useMemo(() => {
    if (timeframe === 'all') return transactions;

    const now = new Date();
    if (timeframe === '30days') {
      const past30 = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      return transactions.filter((t) => t.date >= past30);
    }
    if (timeframe === '6months') {
      const past6M = new Date(now.getTime() - 180 * 86400000).toISOString().split('T')[0];
      return transactions.filter((t) => t.date >= past6M);
    }
    return transactions;
  }, [transactions, timeframe]);

  // 1. Monthly Income vs Expense Timeline
  const monthlyTimeline = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};

    for (const t of filteredTxs) {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!map[month]) {
        map[month] = { month, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        map[month].income += t.amount;
      } else {
        map[month].expense += t.amount;
      }
    }

    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTxs]);

  // 2. Category Distribution (Expenses only)
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filteredTxs) {
      if (t.type === 'expense') {
        map[t.category] = (map[t.category] || 0) + t.amount;
      }
    }
    const list = Object.entries(map).map(([name, value]) => ({ name, value }));
    return list.sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  // 3. Payment Method Distribution
  const paymentMethodData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of filteredTxs) {
      map[t.paymentMethod] = (map[t.paymentMethod] || 0) + t.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredTxs]);

  // Summary Metrics
  const totalIncome = filteredTxs.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTxs.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl text-xs space-y-1">
          <p className="font-semibold text-slate-200">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.stroke || entry.fill }}>
              {entry.name}: {formatCurrency(entry.value, currency)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Timeframe Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Financial Analytics & Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual breakdown of cash inflows, outflows, categories, and payment channels
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          {(['all', '6months', '30days'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                timeframe === period
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {period === 'all' ? 'All Time' : period === '6months' ? 'Past 6 Mos' : 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Analyzed Inflow</span>
            <p className="text-xl font-black text-emerald-400">{formatCurrency(totalIncome, currency)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total Analyzed Outflow</span>
            <p className="text-xl font-black text-rose-400">{formatCurrency(totalExpense, currency)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Income vs Expense Timeline */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Income vs Expense Trend</h2>
              <p className="text-[11px] text-slate-400">Monthly cashflow comparison</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {monthlyTimeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Not enough monthly records to render timeline chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                  <Tooltip content={customTooltip} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category Breakdown Donut */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Expense by Category</h2>
            <p className="text-[11px] text-slate-400">Spending share per category</p>
          </div>

          <div className="h-60 w-full">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No expense records available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top 4 Categories List */}
          <div className="space-y-1.5 pt-1">
            {categoryData.slice(0, 4).map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-semibold text-white">{formatCurrency(item.value, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods Bar Chart */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Payment Channel Usage</h2>
          <p className="text-[11px] text-slate-400">Total volume processed per method (bKash, Bank, Cash, Card, etc.)</p>
        </div>

        <div className="h-64 w-full">
          {paymentMethodData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No transactions to display
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="value" name="Volume" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
