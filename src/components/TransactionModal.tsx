import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  Upload,
  Repeat,
  Briefcase,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod, RecurringFrequency } from '../types';
import { DEFAULT_CATEGORIES, PAYMENT_METHODS, formatCurrency, getLocalDateString } from '../utils/currency';
import { useFinance } from '../context/FinanceContext';
import { parseSmartEntryWithAI } from '../services/aiParser';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  defaultOpenAI?: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
  defaultType = 'expense',
  defaultOpenAI = false,
}) => {
  const { addTransaction, updateTransaction, transactions, currency } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(() => getLocalDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('monthly');
  const [clientProject, setClientProject] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Gemini AI Smart Entry state
  const [showAIPanel, setShowAIPanel] = useState<boolean>(false);
  const [aiInputText, setAiInputText] = useState<string>('');
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [aiImageMime, setAiImageMime] = useState<string>('image/jpeg');
  const [isParsingAI, setIsParsingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessNote, setAiSuccessNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extract unique existing client projects for fast selection
  const existingProjects = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      if (tx.clientProject && tx.clientProject.trim()) {
        set.add(tx.clientProject.trim());
      }
    }
    return Array.from(set).sort();
  }, [transactions]);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(String(initialTransaction.amount));
      setCategory(initialTransaction.category);
      setDescription(initialTransaction.description);
      setDate(initialTransaction.date);
      setPaymentMethod(initialTransaction.paymentMethod);
      setIsRecurring(Boolean(initialTransaction.isRecurring));
      setRecurringFrequency(initialTransaction.recurringFrequency || 'monthly');
      setClientProject(initialTransaction.clientProject || '');
      setNotes(initialTransaction.notes || '');
      setTags(initialTransaction.tags || []);
      setShowAIPanel(false);
    } else {
      const startType = defaultType || 'expense';
      setType(startType);
      setAmount('');
      setCategory(DEFAULT_CATEGORIES[startType][0]);
      setDescription('');
      setDate(getLocalDateString());
      setPaymentMethod('Cash');
      setIsRecurring(false);
      setRecurringFrequency('monthly');
      setClientProject('');
      setNotes('');
      setTags([]);
      setShowAIPanel(Boolean(defaultOpenAI));
    }
    setError(null);
    setAiInputText('');
    setAiImagePreview(null);
    setAiError(null);
    setAiSuccessNote(null);
  }, [initialTransaction, isOpen, defaultType, defaultOpenAI]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const available = DEFAULT_CATEGORIES[newType];
    if (!available.includes(category)) {
      setCategory(available[0]);
    }
  };

  const handleReceiptImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAiError('Please choose an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAiError('Receipt image must be under 8 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAiImagePreview(String(reader.result || ''));
      setAiImageMime(file.type || 'image/jpeg');
      setAiError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleParseWithGemini = async () => {
    setAiError(null);
    setAiSuccessNote(null);

    if (!aiInputText.trim() && !aiImagePreview) {
      setAiError('Paste a bank/bKash SMS, receipt/recipe text, or upload a receipt photo first.');
      return;
    }

    try {
      setIsParsingAI(true);
      const parsed = await parseSmartEntryWithAI({
        text: aiInputText.trim() || undefined,
        imageBase64: aiImagePreview || undefined,
        mimeType: aiImageMime,
        currency,
        knownProjects: existingProjects,
      });

      setType(parsed.type);
      setAmount(String(parsed.amount));
      setCategory(parsed.category);
      setDescription(parsed.description);
      setDate(parsed.date);
      setPaymentMethod(parsed.paymentMethod);
      setIsRecurring(Boolean(parsed.isRecurring));
      if (parsed.recurringFrequency) {
        setRecurringFrequency(parsed.recurringFrequency);
      }
      if (parsed.clientProject) {
        setClientProject(parsed.clientProject);
      }
      if (parsed.notes) {
        setNotes(parsed.notes);
      }

      setAiSuccessNote(parsed.confidenceNote || 'Fields pre-filled! Review and save below.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to extract transaction with Gemini AI.';
      setAiError(msg);
    } finally {
      setIsParsingAI(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a short description.');
      return;
    }

    if (!category.trim()) {
      setError('Please select a category.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        type,
        amount: numericAmount,
        category,
        description: description.trim(),
        date,
        paymentMethod,
        isRecurring,
        recurringFrequency: isRecurring ? recurringFrequency : undefined,
        clientProject: clientProject.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: tags.length ? tags : undefined,
      };

      if (initialTransaction) {
        await updateTransaction({
          ...initialTransaction,
          ...payload,
        });
      } else {
        await addTransaction(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl glass-card-elevated p-5 sm:p-6 text-slate-900 dark:text-slate-100 my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                type === 'income'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
              }`}
            >
              {type === 'income' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                {initialTransaction ? 'Edit Transaction' : 'Smart Entry'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialTransaction ? 'Update payment, recurring, or project details' : 'Manual entry or AI receipt & SMS scan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!initialTransaction && (
              <button
                type="button"
                onClick={() => setShowAIPanel((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  showAIPanel
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/12 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>AI Scan</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gemini AI Receipt / Recipe / SMS Parser Panel */}
        {showAIPanel && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] border border-emerald-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Gemini AI Receipt, Recipe & SMS Parser
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                bKash · Bank SMS · Bills
              </span>
            </div>

            <textarea
              rows={3}
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder='Paste bKash/Nagad/bank SMS, receipt lines, or recipe grocery list (e.g., "Payment Tk 1,250.00 to Netflix failed/success..." or "Chicken 450, Olive oil 620...")'
              className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl glass-well hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{aiImagePreview ? 'Change Photo' : 'Upload Receipt'}</span>
                </button>

                {aiImagePreview && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl glass-well">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">Photo attached</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAiImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-slate-400 hover:text-rose-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleParseWithGemini}
                disabled={isParsingAI}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#103b2a] hover:bg-[#165039] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold shadow-md transition disabled:opacity-60"
              >
                {isParsingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Fields</span>
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {aiSuccessNote && (
              <div className="p-2.5 rounded-xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{aiSuccessNote}</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle: Expense / Income */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl glass-well">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                type === 'income'
                  ? 'bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md shadow-emerald-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Income
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Amount ({currency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full pl-4 pr-16 py-3 rounded-xl glass-well text-slate-900 dark:text-white text-lg font-extrabold tabular-nums placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                {currency}
              </div>
            </div>
            {amount && !isNaN(parseFloat(amount)) && (
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Preview:{' '}
                <span className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                  {formatCurrency(parseFloat(amount), currency)}
                </span>
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Grocery shopping, Netflix subscription, Client milestone..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              >
                {DEFAULT_CATEGORIES[type].map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method} className="bg-white dark:bg-slate-900">
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Client / Project Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Client / Project Tag
              </label>
              <input
                type="text"
                value={clientProject}
                onChange={(e) => setClientProject(e.target.value)}
                placeholder="e.g., Acme Corp, Mobile App..."
                className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {existingProjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 -mt-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-1">Recent projects:</span>
              {existingProjects.slice(0, 6).map((proj) => (
                <button
                  key={proj}
                  type="button"
                  onClick={() => setClientProject(proj)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                    clientProject === proj
                      ? 'bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950'
                      : 'glass-well text-slate-600 dark:text-slate-300 hover:border-emerald-500/40'
                  }`}
                >
                  {proj}
                </button>
              ))}
            </div>
          )}

          {/* Recurring Bill Toggle */}
          <div className="p-3.5 rounded-2xl glass-well space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Recurring Bill / Schedule</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Track subscriptions, rent, utilities, or retainers
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isRecurring}
                onClick={() => setIsRecurring((prev) => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  isRecurring ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                    isRecurring ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                {(['weekly', 'monthly', 'yearly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setRecurringFrequency(freq)}
                    className={`py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                      recurringFrequency === freq
                        ? 'bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950'
                        : 'bg-black/5 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-black/10 dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Keywords / Tags (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="e.g. tax-deductible, trip"
                className="flex-1 px-3 py-2 rounded-xl glass-well text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 rounded-xl glass-well hover:border-emerald-500/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] glass-well text-slate-700 dark:text-slate-300"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-500 ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Receipt breakdown, TrxID, or details..."
              className="w-full px-3.5 py-2 rounded-xl glass-well text-slate-900 dark:text-white text-xs placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition active:scale-95 ${
                type === 'income'
                  ? 'bg-[#103b2a] hover:bg-[#165039] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              } disabled:opacity-50`}
            >
              {isSubmitting ? 'Saving...' : initialTransaction ? 'Update Entry' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
