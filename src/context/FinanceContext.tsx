import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  Transaction,
  Budget,
  SavingsGoal,
  SupportedCurrency,
  ViewTab,
  SyncQueueItem,
} from '../types';
import {
  getLocalTransactions,
  saveLocalTransaction,
  saveAllLocalTransactions,
  deleteLocalTransaction,
  getLocalBudgets,
  saveLocalBudget,
  saveAllLocalBudgets,
  deleteLocalBudget,
  getLocalSavingsGoals,
  saveLocalSavingsGoal,
  saveAllLocalSavingsGoals,
  deleteLocalSavingsGoal,
  enqueueSyncItem,
  getSyncQueue,
  removeSyncQueueItem,
  clearSyncQueue,
  clearAllLocalData,
} from '../services/indexedDB';
import {
  db,
  syncTransactionToFirestore,
  deleteTransactionFromFirestore,
  syncBudgetToFirestore,
  deleteBudgetFromFirestore,
  syncSavingsGoalToFirestore,
  deleteSavingsGoalFromFirestore,
  subscribeToUserTransactions,
  subscribeToUserBudgets,
  subscribeToUserGoals,
} from '../services/firebase';
import { useAuth } from './AuthContext';

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  currency: SupportedCurrency;
  setCurrency: (curr: SupportedCurrency) => void;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  lastSyncTime: Date | null;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<Budget>;
  updateBudget: (b: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<SavingsGoal>;
  updateSavingsGoal: (g: SavingsGoal) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number) => Promise<void>;
  triggerSyncNow: () => Promise<void>;
  importData: (data: { transactions?: Transaction[]; budgets?: Budget[]; goals?: SavingsGoal[] }) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?.uid || 'local-user';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [currency, setCurrencyState] = useState<SupportedCurrency>(() => {
    const saved = localStorage.getItem('smart_expense_currency');
    return (saved as SupportedCurrency) || 'BDT';
  });
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const initialLoadedRef = useRef(false);

  // Currency persistence
  const setCurrency = (curr: SupportedCurrency) => {
    setCurrencyState(curr);
    localStorage.setItem('smart_expense_currency', curr);
  };

  // Update pending sync count
  const refreshPendingCount = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      setPendingSyncCount(queue.length);
    } catch {
      // fallback
    }
  }, []);

  // Flush sync queue to Firestore
  const flushSyncQueue = useCallback(async () => {
    if (!user || !db || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const queue = await getSyncQueue();
      for (const item of queue) {
        try {
          if (item.collection === 'transactions') {
            if (item.action === 'create' || item.action === 'update') {
              const txToSync = { ...item.data, userId: user.uid };
              await syncTransactionToFirestore(user.uid, txToSync);
              await saveLocalTransaction({ ...txToSync, syncedToCloud: true });
            } else if (item.action === 'delete') {
              await deleteTransactionFromFirestore(user.uid, item.data.id);
            }
          } else if (item.collection === 'budgets') {
            if (item.action === 'create' || item.action === 'update') {
              const bgToSync = { ...item.data, userId: user.uid };
              await syncBudgetToFirestore(user.uid, bgToSync);
              await saveLocalBudget(bgToSync);
            } else if (item.action === 'delete') {
              await deleteBudgetFromFirestore(user.uid, item.data.id);
            }
          } else if (item.collection === 'savingsGoals') {
            if (item.action === 'create' || item.action === 'update') {
              const sgToSync = { ...item.data, userId: user.uid };
              await syncSavingsGoalToFirestore(user.uid, sgToSync);
              await saveLocalSavingsGoal(sgToSync);
            } else if (item.action === 'delete') {
              await deleteSavingsGoalFromFirestore(user.uid, item.data.id);
            }
          }
          await removeSyncQueueItem(item.id);
        } catch (itemErr) {
          console.warn('Sync item retry needed later', itemErr);
        }
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed flushing sync queue', err);
    } finally {
      await refreshPendingCount();
      setIsSyncing(false);
    }
  }, [user, refreshPendingCount]);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync on reconnect!
      flushSyncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushSyncQueue]);

  // Initial data loading from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const [localTxs, localBgs, localSgs] = await Promise.all([
          getLocalTransactions(),
          getLocalBudgets(),
          getLocalSavingsGoals(),
        ]);

        // Filter out any legacy demo records
        const cleanTxs = localTxs.filter(
          (t) => t.userId !== 'demo-user' && !t.id.match(/^tx-[1-7]$/)
        );
        const cleanBgs = localBgs.filter(
          (b) => b.userId !== 'demo-user' && !b.id.match(/^bg-[1-4]$/)
        );
        const cleanSgs = localSgs.filter(
          (g) => g.userId !== 'demo-user' && !g.id.match(/^sg-[1-3]$/)
        );

        if (
          cleanTxs.length !== localTxs.length ||
          cleanBgs.length !== localBgs.length ||
          cleanSgs.length !== localSgs.length
        ) {
          await Promise.all([
            saveAllLocalTransactions(cleanTxs),
            saveAllLocalBudgets(cleanBgs),
            saveAllLocalSavingsGoals(cleanSgs),
          ]);
        }

        setTransactions(cleanTxs);
        setBudgets(cleanBgs);
        setSavingsGoals(cleanSgs);

        await refreshPendingCount();
        initialLoadedRef.current = true;
      } catch (err) {
        console.error('Failed loading initial local data', err);
      }
    }

    loadData();
  }, [user, refreshPendingCount]);

  // Firestore real-time subscriptions when authenticated
  useEffect(() => {
    if (!user || !db || !isOnline) return;

    let unsubTxs: (() => void) | null = null;
    let unsubBudgets: (() => void) | null = null;
    let unsubGoals: (() => void) | null = null;

    try {
      unsubTxs = subscribeToUserTransactions(user.uid, (remoteTxs) => {
        setTransactions(remoteTxs);
        saveAllLocalTransactions(remoteTxs);
        setLastSyncTime(new Date());
      });

      unsubBudgets = subscribeToUserBudgets(user.uid, (remoteBudgets) => {
        setBudgets(remoteBudgets);
        saveAllLocalBudgets(remoteBudgets);
      });

      unsubGoals = subscribeToUserGoals(user.uid, (remoteGoals) => {
        setSavingsGoals(remoteGoals);
        saveAllLocalSavingsGoals(remoteGoals);
      });

      // Flush any queued offline changes and migrate local records to cloud
      (async () => {
        try {
          const localTxs = await getLocalTransactions();
          const unSyncedTxs = localTxs.filter(t => !t.syncedToCloud || t.userId !== user.uid);
          for (const tx of unSyncedTxs) {
            const stamped = { ...tx, userId: user.uid, syncedToCloud: true };
            await syncTransactionToFirestore(user.uid, stamped);
            await saveLocalTransaction(stamped);
          }
        } catch (migErr) {
          console.warn('Auto-migration note:', migErr);
        }
        await flushSyncQueue();
      })();
    } catch (e) {
      console.warn('Real-time listener setup error', e);
    }

    return () => {
      if (unsubTxs) unsubTxs();
      if (unsubBudgets) unsubBudgets();
      if (unsubGoals) unsubGoals();
    };
  }, [user, isOnline, flushSyncQueue]);

  // Transaction CRUD
  const addTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<Transaction> => {
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    };

    // Optimistic local update
    setTransactions((prev) => [newTx, ...prev]);
    await saveLocalTransaction(newTx);

    // Sync to Firestore or Queue
    if (user && db && isOnline) {
      try {
        await syncTransactionToFirestore(user.uid, newTx);
        newTx.syncedToCloud = true;
        await saveLocalTransaction(newTx);
        setLastSyncTime(new Date());
      } catch (err) {
        console.warn('Could not sync transaction immediately, queuing', err);
        await enqueueSyncItem({
          collection: 'transactions',
          action: 'create',
          data: newTx,
        });
        await refreshPendingCount();
      }
    } else {
      // Offline or Guest mode: queue item so that once user logs in or reconnects, it immediately syncs to Firestore
      await enqueueSyncItem({
        collection: 'transactions',
        action: 'create',
        data: newTx,
      });
      await refreshPendingCount();
    }

    return newTx;
  };

  const updateTransaction = async (tx: Transaction): Promise<void> => {
    const updated: Transaction = {
      ...tx,
      updatedAt: new Date().toISOString(),
      syncedToCloud: false,
    };

    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    await saveLocalTransaction(updated);

    if (user && db && isOnline) {
      try {
        await syncTransactionToFirestore(user.uid, updated);
        updated.syncedToCloud = true;
        await saveLocalTransaction(updated);
        setLastSyncTime(new Date());
      } catch (err) {
        await enqueueSyncItem({
          collection: 'transactions',
          action: 'update',
          data: updated,
        });
        await refreshPendingCount();
      }
    } else if (user) {
      await enqueueSyncItem({
        collection: 'transactions',
        action: 'update',
        data: updated,
      });
      await refreshPendingCount();
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await deleteLocalTransaction(id);

    if (user && db && isOnline) {
      try {
        await deleteTransactionFromFirestore(user.uid, id);
        setLastSyncTime(new Date());
      } catch (err) {
        await enqueueSyncItem({
          collection: 'transactions',
          action: 'delete',
          data: { id },
        });
        await refreshPendingCount();
      }
    } else if (user) {
      await enqueueSyncItem({
        collection: 'transactions',
        action: 'delete',
        data: { id },
      });
      await refreshPendingCount();
    }
  };

  // Budgets CRUD
  const addBudget = async (
    bData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<Budget> => {
    const newBudget: Budget = {
      ...bData,
      id: `bg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setBudgets((prev) => [...prev, newBudget]);
    await saveLocalBudget(newBudget);

    if (user && db && isOnline) {
      try {
        await syncBudgetToFirestore(user.uid, newBudget);
      } catch {
        await enqueueSyncItem({ collection: 'budgets', action: 'create', data: newBudget });
        await refreshPendingCount();
      }
    } else if (user) {
      await enqueueSyncItem({ collection: 'budgets', action: 'create', data: newBudget });
      await refreshPendingCount();
    }

    return newBudget;
  };

  const updateBudget = async (b: Budget): Promise<void> => {
    const updated: Budget = { ...b, updatedAt: new Date().toISOString() };
    setBudgets((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    await saveLocalBudget(updated);

    if (user && db && isOnline) {
      try {
        await syncBudgetToFirestore(user.uid, updated);
      } catch {
        await enqueueSyncItem({ collection: 'budgets', action: 'update', data: updated });
        await refreshPendingCount();
      }
    } else if (user) {
      await enqueueSyncItem({ collection: 'budgets', action: 'update', data: updated });
      await refreshPendingCount();
    }
  };

  const deleteBudget = async (id: string): Promise<void> => {
    setBudgets((prev) => prev.filter((item) => item.id !== id));
    await deleteLocalBudget(id);

    if (user && db && isOnline) {
      try {
        await deleteBudgetFromFirestore(user.uid, id);
      } catch {
        await enqueueSyncItem({ collection: 'budgets', action: 'delete', data: { id } });
        await refreshPendingCount();
      }
    } else if (user) {
      await enqueueSyncItem({ collection: 'budgets', action: 'delete', data: { id } });
      await refreshPendingCount();
    }
  };

  // Savings Goals CRUD
  const addSavingsGoal = async (
    gData: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<SavingsGoal> => {
    const newGoal: SavingsGoal = {
      ...gData,
      id: `sg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavingsGoals((prev) => [...prev, newGoal]);
    await saveLocalSavingsGoal(newGoal);

    if (user && db && isOnline) {
      try {
        await syncSavingsGoalToFirestore(user.uid, newGoal);
      } catch {
        await enqueueSyncItem({ collection: 'savingsGoals', action: 'create', data: newGoal });
        await refreshPendingCount();
      }
    } else if (user) {
      await enqueueSyncItem({ collection: 'savingsGoals', action: 'create', data: newGoal });
      await refreshPendingCount();
    }

    return newGoal;
  };

  const updateSavingsGoal = async (g: SavingsGoal): Promise<void> => {
    const updated: SavingsGoal = { ...g, updatedAt: new Date().toISOString() };
    setSavingsGoals((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    await saveLocalSavingsGoal(updated);

    if (user && db && isOnline) {
      try {
        await syncSavingsGoalToFirestore(user.uid, updated);
      } catch {
        await enqueueSyncItem({ collection: 'savingsGoals', action: 'update', data: updated });
        await refreshPendingCount();
      }
    } else if (user) {
      await enqueueSyncItem({ collection: 'savingsGoals', action: 'update', data: updated });
      await refreshPendingCount();
    }
  };

  const deleteSavingsGoal = async (id: string): Promise<void> => {
    setSavingsGoals((prev) => prev.filter((item) => item.id !== id));
    await deleteLocalSavingsGoal(id);

    if (user && db && isOnline) {
      try {
        await deleteSavingsGoalFromFirestore(user.uid, id);
      } catch {
        await enqueueSyncItem({ collection: 'savingsGoals', action: 'delete', data: { id } });
        await refreshPendingCount();
      }
    } else if (user) {
      await enqueueSyncItem({ collection: 'savingsGoals', action: 'delete', data: { id } });
      await refreshPendingCount();
    }
  };

  const addGoalContribution = async (goalId: string, amount: number): Promise<void> => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return;

    const newCurrent = Math.max(0, goal.currentAmount + amount);
    await updateSavingsGoal({ ...goal, currentAmount: newCurrent });
  };

  const triggerSyncNow = async (): Promise<void> => {
    await flushSyncQueue();
  };

  const importData = async (data: {
    transactions?: Transaction[];
    budgets?: Budget[];
    goals?: SavingsGoal[];
  }): Promise<void> => {
    if (data.transactions && data.transactions.length > 0) {
      setTransactions(data.transactions);
      await saveAllLocalTransactions(data.transactions);
    }
    if (data.budgets && data.budgets.length > 0) {
      setBudgets(data.budgets);
      await saveAllLocalBudgets(data.budgets);
    }
    if (data.goals && data.goals.length > 0) {
      setSavingsGoals(data.goals);
      await saveAllLocalSavingsGoals(data.goals);
    }
  };

  const clearAllData = async (): Promise<void> => {
    setTransactions([]);
    setBudgets([]);
    setSavingsGoals([]);
    await clearAllLocalData();
    setPendingSyncCount(0);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        savingsGoals,
        currency,
        setCurrency,
        activeTab,
        setActiveTab,
        isOnline,
        isSyncing,
        pendingSyncCount,
        lastSyncTime,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBudget,
        updateBudget,
        deleteBudget,
        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        addGoalContribution,
        triggerSyncNow,
        importData,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
