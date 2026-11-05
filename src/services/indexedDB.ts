import { Transaction, Budget, SavingsGoal, UserSettings, SyncQueueItem } from '../types';

const DB_NAME = 'SmartExpenseDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('userId', 'userId', { unique: false });
        txStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains('budgets')) {
        const bStore = db.createObjectStore('budgets', { keyPath: 'id' });
        bStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('savingsGoals')) {
        const sStore = db.createObjectStore('savingsGoals', { keyPath: 'id' });
        sStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        const qStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        qStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// Generic store helpers
async function performTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest | void
): Promise<T> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let resultReq: IDBRequest | null = null;

    try {
      const maybeReq = callback(store);
      if (maybeReq) resultReq = maybeReq;
    } catch (err) {
      reject(err);
      return;
    }

    tx.oncomplete = () => {
      resolve(resultReq ? resultReq.result : (undefined as unknown as T));
    };

    tx.onerror = () => {
      reject(tx.error);
    };
  });
}

// Transactions
export async function getLocalTransactions(userId?: string): Promise<Transaction[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('transactions', 'readonly');
      const store = tx.objectStore('transactions');
      const request = store.getAll();
      request.onsuccess = () => {
        let items: Transaction[] = request.result || [];
        if (userId) {
          items = items.filter(t => t.userId === userId || t.userId === 'demo-user');
        }
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('IndexedDB unavailable, falling back to localStorage', e);
    const raw = localStorage.getItem('smart_expense_transactions');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveLocalTransaction(transaction: Transaction): Promise<void> {
  try {
    await performTx('transactions', 'readwrite', (store) => {
      store.put(transaction);
    });
  } catch (e) {
    console.warn('IndexedDB save failed, saving to localStorage', e);
  }
}

export async function saveAllLocalTransactions(transactions: Transaction[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.clear();
    for (const item of transactions) {
      store.put(item);
    }
  } catch (e) {
    console.warn('Failed bulk save to IndexedDB', e);
    localStorage.setItem('smart_expense_transactions', JSON.stringify(transactions));
  }
}

export async function deleteLocalTransaction(id: string): Promise<void> {
  try {
    await performTx('transactions', 'readwrite', (store) => {
      store.delete(id);
    });
  } catch (e) {
    console.warn('IndexedDB delete failed', e);
  }
}

// Budgets
export async function getLocalBudgets(userId?: string): Promise<Budget[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', 'readonly');
      const store = tx.objectStore('budgets');
      const request = store.getAll();
      request.onsuccess = () => {
        let items: Budget[] = request.result || [];
        if (userId) {
          items = items.filter(b => b.userId === userId || b.userId === 'demo-user');
        }
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    const raw = localStorage.getItem('smart_expense_budgets');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveLocalBudget(budget: Budget): Promise<void> {
  try {
    await performTx('budgets', 'readwrite', (store) => {
      store.put(budget);
    });
  } catch (e) {
    console.warn('Failed to save budget to IndexedDB', e);
  }
}

export async function saveAllLocalBudgets(budgets: Budget[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('budgets', 'readwrite');
    const store = tx.objectStore('budgets');
    store.clear();
    for (const item of budgets) {
      store.put(item);
    }
  } catch (e) {
    localStorage.setItem('smart_expense_budgets', JSON.stringify(budgets));
  }
}

export async function deleteLocalBudget(id: string): Promise<void> {
  try {
    await performTx('budgets', 'readwrite', (store) => {
      store.delete(id);
    });
  } catch (e) {
    console.warn('Failed to delete budget from IndexedDB', e);
  }
}

// Savings Goals
export async function getLocalSavingsGoals(userId?: string): Promise<SavingsGoal[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('savingsGoals', 'readonly');
      const store = tx.objectStore('savingsGoals');
      const request = store.getAll();
      request.onsuccess = () => {
        let items: SavingsGoal[] = request.result || [];
        if (userId) {
          items = items.filter(g => g.userId === userId || g.userId === 'demo-user');
        }
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    const raw = localStorage.getItem('smart_expense_goals');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveLocalSavingsGoal(goal: SavingsGoal): Promise<void> {
  try {
    await performTx('savingsGoals', 'readwrite', (store) => {
      store.put(goal);
    });
  } catch (e) {
    console.warn('Failed to save savings goal to IndexedDB', e);
  }
}

export async function saveAllLocalSavingsGoals(goals: SavingsGoal[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction('savingsGoals', 'readwrite');
    const store = tx.objectStore('savingsGoals');
    store.clear();
    for (const item of goals) {
      store.put(item);
    }
  } catch (e) {
    localStorage.setItem('smart_expense_goals', JSON.stringify(goals));
  }
}

export async function deleteLocalSavingsGoal(id: string): Promise<void> {
  try {
    await performTx('savingsGoals', 'readwrite', (store) => {
      store.delete(id);
    });
  } catch (e) {
    console.warn('Failed to delete savings goal from IndexedDB', e);
  }
}

// Sync Queue for Offline Operations
export async function enqueueSyncItem(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<SyncQueueItem> {
  const queueItem: SyncQueueItem = {
    ...item,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    retryCount: 0,
  };

  try {
    await performTx('syncQueue', 'readwrite', (store) => {
      store.put(queueItem);
    });
  } catch (e) {
    console.warn('Failed to enqueue sync item to IndexedDB', e);
    const existing: SyncQueueItem[] = JSON.parse(localStorage.getItem('smart_expense_sync_queue') || '[]');
    existing.push(queueItem);
    localStorage.setItem('smart_expense_sync_queue', JSON.stringify(existing));
  }

  return queueItem;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    const raw = localStorage.getItem('smart_expense_sync_queue');
    return raw ? JSON.parse(raw) : [];
  }
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  try {
    await performTx('syncQueue', 'readwrite', (store) => {
      store.delete(id);
    });
  } catch (e) {
    const existing: SyncQueueItem[] = JSON.parse(localStorage.getItem('smart_expense_sync_queue') || '[]');
    const filtered = existing.filter(i => i.id !== id);
    localStorage.setItem('smart_expense_sync_queue', JSON.stringify(filtered));
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    await performTx('syncQueue', 'readwrite', (store) => {
      store.clear();
    });
  } catch (e) {
    localStorage.removeItem('smart_expense_sync_queue');
  }
}
