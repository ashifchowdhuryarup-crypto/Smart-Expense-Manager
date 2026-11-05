import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit2,
  CreditCard,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import {
  formatCurrency,
  exportTransactionsToCSV,
  DEFAULT_CATEGORIES,
  PAYMENT_METHODS,
  getCurrentYearMonth,
} from '../utils/currency';

interface TransactionsViewProps {
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddTransaction,
  onEditTransaction,
}) => {
  const { transactions, currency, deleteTransaction } = useFinance();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc'>('dateDesc');

  const currentYearMonth = getCurrentYearMonth();

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
        const matchesTags = tx.tags ? tx.tags.some((t) => t.toLowerCase().includes(query)) : false;
        if (!matchesDesc && !matchesCat && !matchesNotes && !matchesTags) return false;
      }

      // Type
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // Category
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // Payment method
      if (selectedPaymentMethod !== 'all' && tx.paymentMethod !== selectedPaymentMethod) return false;

      // Date filter
      if (dateFilter === 'thisMonth') {
        if (!tx.date.startsWith(currentYearMonth)) return false;
      } else if (dateFilter === 'lastMonth') {
        const [year, month] = currentYearMonth.split('-').map(Number);
        const lastMonthNum = month === 1 ? 12 : month - 1;
        const lastYearNum = month === 1 ? year - 1 : year;
        const lastMonthPrefix = `${lastYearNum}-${String(lastMonthNum).padStart(2, '0')}`;
        if (!tx.date.startsWith(lastMonthPrefix)) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'dateDesc') return b.date.localeCompare(a.date);
      if (sortBy === 'dateAsc') return a.date.localeCompare(b.date);
      if (sortBy === 'amountDesc') return b.amount - a.amount;
      if (sortBy === 'amountAsc') return a.amount - b.amount;
      return 0;
    });
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedCategory,
    selectedPaymentMethod,
    dateFilter,
    customStartDate,
    customEndDate,
    sortBy,
    currentYearMonth,
  ]);

  // Totals for filtered view
  const filteredSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const filename = `smart_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    exportTransactionsToCSV(filteredTransactions, filename);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('dateDesc');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedType !== 'all' ||
    selectedCategory !== 'all' ||
    selectedPaymentMethod !== 'all' ||
    dateFilter !== 'all';

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense])
  );

  return (
    <div className="space-y-6">
      {/* Header and CSV Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Transactions History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse, filter, search, and export your personal finance records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export CSV ({filteredTransactions.length})
          </button>

          <button
            onClick={onOpenAddTransaction}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Entry
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, category, tags..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Types</option>
              <option value="income">Income (+)</option>
              <option value="expense">Expense (-)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="md:col-span-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Time</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Second Row: Payment method, Custom dates, Sort & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Payment Method */}
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">All Payment Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {pm}
                </option>
              ))}
            </select>

            {/* Custom Range Inputs */}
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                />
                <span className="text-slate-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
            )}

            {/* Sort Order */}
            <div className="flex items-center gap-1 text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="dateDesc">Date: Newest First</option>
                <option value="dateAsc">Date: Oldest First</option>
                <option value="amountDesc">Amount: High to Low</option>
                <option value="amountAsc">Amount: Low to High</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Filtered Summary Ribbon */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div>
          <span className="text-slate-400">Filtered Inflow:</span>
          <p className="font-bold text-emerald-400 text-sm">{formatCurrency(filteredSummary.income, currency)}</p>
        </div>
        <div>
          <span className="text-slate-400">Filtered Outflow:</span>
          <p className="font-bold text-rose-400 text-sm">{formatCurrency(filteredSummary.expense, currency)}</p>
        </div>
        <div>
          <span className="text-slate-400">Net Difference:</span>
          <p className={`font-bold text-sm ${filteredSummary.net >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatCurrency(filteredSummary.net, currency)}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No transactions match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query, changing filters, or adding a new transaction.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-indigo-400 font-medium transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 rounded-xl transition group"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-200 truncate">{tx.description}</p>
                      {tx.syncedToCloud && (
                        <span className="text-[10px] text-emerald-500" title="Synchronized to Firestore Cloud">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-2.5 h-2.5" /> {tx.paymentMethod}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" /> {tx.date}
                      </span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="italic truncate max-w-xs text-slate-500">"{tx.notes}"</span>
                        </>
                      )}
                    </div>

                    {tx.tags && tx.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tx.tags.map((tag) => (
                          <span key={tag} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/40">
                  <span
                    className={`text-sm font-bold ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      aria-label="Edit transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      aria-label="Delete transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete"
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
