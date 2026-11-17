/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { AlertCircle, X } from 'lucide-react';
import { Header } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsGoalsView } from './components/BudgetsGoalsView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { SavingsGoalModal } from './components/SavingsGoalModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { Transaction, TransactionType, Budget, SavingsGoal } from './types';

function MainAppShell() {
  const { activeTab } = useFinance();
  const { error: authError, clearError } = useAuth();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [txDefaultType, setTxDefaultType] = useState<TransactionType>('expense');
  const [txDefaultOpenAI, setTxDefaultOpenAI] = useState(false);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalModalMode, setGoalModalMode] = useState<'createOrEdit' | 'contribute'>('createOrEdit');

  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);

  const handleOpenAddTransaction = (options?: { type?: TransactionType; openAI?: boolean }) => {
    setEditingTransaction(null);
    setTxDefaultType(options?.type || 'expense');
    setTxDefaultOpenAI(Boolean(options?.openAI));
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTxDefaultType(tx.type);
    setTxDefaultOpenAI(false);
    setIsTxModalOpen(true);
  };

  const handleOpenAddBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalOpen(true);
  };

  const handleEditBudget = (b: Budget) => {
    setEditingBudget(b);
    setIsBudgetModalOpen(true);
  };

  const handleOpenAddGoal = () => {
    setEditingGoal(null);
    setGoalModalMode('createOrEdit');
    setIsGoalModalOpen(true);
  };

  const handleEditGoal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setGoalModalMode('createOrEdit');
    setIsGoalModalOpen(true);
  };

  const handleOpenContributeGoal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setGoalModalMode('contribute');
    setIsGoalModalOpen(true);
  };

  return (
    <div className="min-h-screen relative flex flex-col font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Subtle Glassmorphism Ambient Glow Backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-32 w-[480px] h-[480px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/12 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 w-[420px] h-[420px] rounded-full bg-teal-500/8 dark:bg-teal-400/10 blur-[120px]" />
        <div className="hidden dark:block absolute -bottom-40 left-1/3 w-[440px] h-[440px] rounded-full bg-emerald-900/20 blur-[140px]" />
      </div>

      {/* Offline and Sync Banner */}
      <OfflineBanner />

      {/* Main Top Header */}
      <Header
        onOpenAddModal={() => handleOpenAddTransaction()}
        onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
      />

      {/* Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenAddTransaction={handleOpenAddTransaction}
            onEditTransaction={handleEditTransaction}
            onOpenContributeModal={handleOpenContributeGoal}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenAddTransaction={() => handleOpenAddTransaction()}
            onOpenAIScan={() => handleOpenAddTransaction({ openAI: true })}
            onEditTransaction={handleEditTransaction}
          />
        )}

        {activeTab === 'budgets' && (
          <BudgetsGoalsView
            onOpenAddBudget={handleOpenAddBudget}
            onEditBudget={handleEditBudget}
            onOpenAddGoal={handleOpenAddGoal}
            onEditGoal={handleEditGoal}
            onOpenContributeModal={handleOpenContributeGoal}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'settings' && (
          <SettingsView onOpenIOSGuide={() => setIsIOSGuideOpen(true)} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenAddModal={() => handleOpenAddTransaction()} />

      {/* Auth Error Toast */}
      {authError && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm p-4 rounded-2xl glass-card-elevated border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs shadow-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-slate-900 dark:text-white">Authentication Notice</p>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">{authError}</p>
          </div>
          <button
            onClick={clearError}
            aria-label="Dismiss error"
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialTransaction={editingTransaction}
        defaultType={txDefaultType}
        defaultOpenAI={txDefaultOpenAI}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        initialBudget={editingBudget}
      />

      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialGoal={editingGoal}
        mode={goalModalMode}
      />

      <PWAInstallModal
        isOpen={isIOSGuideOpen}
        onClose={() => setIsIOSGuideOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <MainAppShell />
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
