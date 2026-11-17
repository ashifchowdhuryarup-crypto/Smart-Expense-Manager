import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Sparkles,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Trash2,
  Edit2,
  CreditCard,
  Calendar,
  X,
  FileSpreadsheet,
  Repeat,
  Briefcase,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction, TransactionType } from '../types';
import {
  formatCurrency,
  exportTransactionsToCSV,
  DEFAULT_CATEGORIES,
  PAYMENT_METHODS,
  getCurrentYearMonth,
  getLocalDateString,
  compareTransactionsNewestFirst,
} from '../utils/currency';

interface TransactionsViewProps {
  onOpenAddTransaction: () => void;
  onOpenAIScan: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddTransaction,
  onOpenAIScan,
  onEditTransaction,
}) => {
  const { transactions, currency, deleteTransaction } = useFinance();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [recurringOnly, setRecurringOnly] = useState<boolean>(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'dateDesc' | 'dateAsc' | 'amountDesc' | 'amountAsc'>('dateDesc');

  const currentYearMonth = getCurrentYearMonth();

  const availableProjects = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      if (tx.clientProject && tx.clientProject.trim()) {
        set.add(tx.clientProject.trim());
      }
    }
    return Array.from(set).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesDesc = tx.description.toLowerCase().includes(query);
          const matchesCat = tx.category.toLowerCase().includes(query);
          const matchesProject = tx.clientProject ? tx.clientProject.toLowerCase().includes(query) : false;
          const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
          const matchesTags = tx.tags ? tx.tags.some((t) => t.toLowerCase().includes(query)) : false;
          if (!matchesDesc && !matchesCat && !matchesProject && !matchesNotes && !matchesTags) return false;
        }

        if (selectedType !== 'all' && tx.type !== selectedType) return false;
        if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
        if (selectedPaymentMethod !== 'all' && tx.paymentMethod !== selectedPaymentMethod) return false;
        if (selectedProject !== 'all' && (tx.clientProject || '').trim() !== selectedProject) return false;
        if (recurringOnly && !tx.isRecurring) return false;

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
      })
      .sort((a, b) => {
        if (sortBy === 'dateDesc') {
          return compareTransactionsNewestFirst(a, b);
        }
        if (sortBy === 'dateAsc') {
          return compareTransactionsNewestFirst(b, a);
        }
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
    selectedProject,
    recurringOnly,
    dateFilter,
    customStartDate,
    customEndDate,
    sortBy,
    currentYearMonth,
  ]);

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
    const filename = `smart_expenses_${getLocalDateString()}.csv`;
    exportTransactionsToCSV(filteredTransactions, filename);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedPaymentMethod('all');
    setSelectedProject('all');
    setRecurringOnly(false);
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
    selectedProject !== 'all' ||
    recurringOnly ||
    dateFilter !== 'all';

  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES.income, ...DEFAULT_CATEGORIES.expense])
  );

  return (
    <div className="space-y-5">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Transactions History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Filter by client project, recurring cadence, payment method, or export CSV
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass-card text-slate-700 dark:text-slate-200 font-semibold text-xs transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Export CSV ({filteredTransactions.length})
          </button>

          <button
            onClick={onOpenAIScan}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/12 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-semibold text-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Scan
          </button>

          <button
            onClick={onOpenAddTransaction}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#103b2a] hover:bg-[#165039] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Entry
          </button>
        </div>
      </div>

      {/* Glass Filter & Search Bar */}
      <div className="p-4 rounded-3xl glass-card space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          {/* Keyword Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, project, category..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="md:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Types</option>
              <option value="income" className="bg-white dark:bg-slate-900">Income (+)</option>
              <option value="expense" className="bg-white dark:bg-slate-900">Expense (-)</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c} className="bg-white dark:bg-slate-900">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Time</option>
              <option value="thisMonth" className="bg-white dark:bg-slate-900">This Month</option>
              <option value="lastMonth" className="bg-white dark:bg-slate-900">Last Month</option>
              <option value="custom" className="bg-white dark:bg-slate-900">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Second Row: Client Project, Recurring Toggle, Payment Method, Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.06] text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Client / Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Projects</option>
              {availableProjects.map((proj) => (
                <option key={proj} value={proj} className="bg-white dark:bg-slate-900">
                  {proj}
                </option>
              ))}
            </select>

            {/* Payment Method */}
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all" className="bg-white dark:bg-slate-900">All Methods</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm} className="bg-white dark:bg-slate-900">
                  {pm}
                </option>
              ))}
            </select>

            {/* Recurring Only Toggle */}
            <button
              type="button"
              onClick={() => setRecurringOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                recurringOnly
                  ? 'bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950'
                  : 'glass-well text-slate-600 dark:text-slate-300 hover:border-emerald-500/40'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Recurring Only</span>
            </button>

            {dateFilter === 'custom' && (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 rounded-xl glass-well text-slate-900 dark:text-white text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 rounded-xl glass-well text-slate-900 dark:text-white text-xs"
                />
              </div>
            )}

            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="dateDesc" className="bg-white dark:bg-slate-900">Newest First</option>
                <option value="dateAsc" className="bg-white dark:bg-slate-900">Oldest First</option>
                <option value="amountDesc" className="bg-white dark:bg-slate-900">Amount: High to Low</option>
                <option value="amountAsc" className="bg-white dark:bg-slate-900">Amount: Low to High</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Filtered Summary Ribbon */}
      <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl glass-card text-xs">
        <div>
          <span className="text-slate-500 dark:text-slate-400">Inflow</span>
          <p className="font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400 text-sm">
            {formatCurrency(filteredSummary.income, currency)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Outflow</span>
          <p className="font-extrabold tabular-nums text-rose-600 dark:text-rose-400 text-sm">
            {formatCurrency(filteredSummary.expense, currency)}
          </p>
        </div>
        <div>
          <span className="text-slate-500 dark:text-slate-400">Net</span>
          <p
            className={`font-extrabold tabular-nums text-sm ${
              filteredSummary.net >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(filteredSummary.net, currency)}
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="p-4 sm:p-5 rounded-3xl glass-card overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-14 px-4">
            <FileSpreadsheet className="w-11 h-11 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No transactions match your filters
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Adjust your search, clear filters, or record a new entry.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="mt-3 px-3.5 py-2 rounded-xl glass-well text-xs text-emerald-700 dark:text-emerald-400 font-semibold transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200/70 dark:divide-white/[0.06]">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="py-3 px-1 sm:px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-black/[0.025] dark:hover:bg-white/[0.03] rounded-2xl transition group"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      {tx.syncedToCloud && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400" title="Synced to Cloud">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{tx.category}</span>
                      {tx.clientProject && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <Briefcase className="w-3 h-3" /> {tx.clientProject}
                          </span>
                        </>
                      )}
                      {tx.isRecurring && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300 font-semibold">
                            <Repeat className="w-3 h-3" /> {tx.recurringFrequency || 'monthly'}
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> {tx.paymentMethod}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3 h-3" /> {tx.date}
                      </span>
                    </div>

                    {(tx.notes || (tx.tags && tx.tags.length > 0)) && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {tx.notes ? `"${tx.notes}"` : ''}
                        {tx.notes && tx.tags?.length ? ' · ' : ''}
                        {tx.tags?.map((tag) => `#${tag}`).join(' ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                  <span
                    className={`text-sm font-extrabold tabular-nums ${
                      tx.type === 'income'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount, currency)}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      aria-label="Edit transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      aria-label="Delete transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
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
