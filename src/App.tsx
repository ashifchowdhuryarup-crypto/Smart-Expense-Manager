/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
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
import { Transaction, Budget, SavingsGoal } from './types';

function MainAppShell() {
  const { activeTab } = useFinance();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [goalModalMode, setGoalModalMode] = useState<'createOrEdit' | 'contribute'>('createOrEdit');

  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);

  // Handlers
  const handleOpenAddTransaction = () => {
    setEditingTransaction(null);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Offline and Sync Banner */}
      <OfflineBanner />

      {/* Main Top Header */}
      <Header
        onOpenAddModal={handleOpenAddTransaction}
        onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
      />

      {/* Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenAddTransaction={handleOpenAddTransaction}
            onEditTransaction={handleEditTransaction}
            onOpenContributeModal={handleOpenContributeGoal}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenAddTransaction={handleOpenAddTransaction}
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
      <MobileBottomNav onOpenAddModal={handleOpenAddTransaction} />

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        initialTransaction={editingTransaction}
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
