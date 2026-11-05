import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  Auth,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { Transaction, Budget, SavingsGoal, UserSettings } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  authInstance?: Auth | null
): never {
  const currentAuth = authInstance || auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || null,
      email: currentAuth?.currentUser?.email || null,
      emailVerified: currentAuth?.currentUser?.emailVerified || null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || null,
      tenantId: currentAuth?.currentUser?.tenantId || null,
      providerInfo:
        currentAuth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

import appletConfig from '../../firebase-applet-config.json';

export function getLoadedFirebaseConfig(): FirebaseConfig | null {
  // Check provisioned applet config first
  if (appletConfig && appletConfig.apiKey && appletConfig.projectId && appletConfig.projectId !== 'remixed-project-id') {
    return {
      apiKey: appletConfig.apiKey,
      authDomain: appletConfig.authDomain,
      projectId: appletConfig.projectId,
      storageBucket: appletConfig.storageBucket,
      messagingSenderId: appletConfig.messagingSenderId,
      appId: appletConfig.appId,
      measurementId: appletConfig.measurementId,
      firestoreDatabaseId: appletConfig.firestoreDatabaseId || undefined,
    };
  }

  // Check env vars next
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || undefined,
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  // Check stored user config in localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('smart_expense_firebase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed reading custom firebase config', e);
    }
  }

  return null;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function initFirebase(customConfig?: FirebaseConfig): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  const config = customConfig || getLoadedFirebaseConfig();

  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }

    auth = getAuth(app);
    db = config.firestoreDatabaseId ? getFirestore(app, config.firestoreDatabaseId) : getFirestore(app);

    return { app, auth, db };
  } catch (error) {
    console.error('Failed to initialize Firebase SDK:', error);
    return null;
  }
}

// Initial attempt to bootstrap
initFirebase();

if (db) {
  getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is unreachable.');
    }
  });
}

export { app, auth, db };

export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Firebase is not initialized. Please configure credentials.' };
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { success: true, message: 'Connected to Firestore successfully.' };
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { success: false, message: 'Client is offline or network is unreachable.' };
    }
    // Permissions error on /test/connection is normal because rules deny unknown collections
    if (error?.code === 'permission-denied') {
      return { success: true, message: 'Connected to Firestore (Security rules active).' };
    }
    return { success: false, message: error?.message || 'Connection failed' };
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please add your Firebase configuration.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    const errorCode = error?.code || '';
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    if (errorCode === 'auth/unauthorized-domain') {
      const err = new Error(
        `Firebase Error: auth/unauthorized-domain. Domain "${currentHost}" is not yet in the Firebase Authorized Domains list. Please add "${currentHost}" under Firebase Console -> Authentication -> Settings -> Authorized domains.`
      );
      (err as any).code = 'auth/unauthorized-domain';
      (err as any).domain = currentHost;
      throw err;
    }
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

// Firestore CRUD operations with error catching
export async function syncTransactionToFirestore(userId: string, tx: Transaction): Promise<void> {
  if (!db) return;
  const docPath = `users/${userId}/transactions/${tx.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'transactions', tx.id), {
      ...tx,
      userId,
      syncedToCloud: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath, auth);
  }
}

export async function deleteTransactionFromFirestore(userId: string, txId: string): Promise<void> {
  if (!db) return;
  const docPath = `users/${userId}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', txId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath, auth);
  }
}

export async function syncBudgetToFirestore(userId: string, budget: Budget): Promise<void> {
  if (!db) return;
  const docPath = `users/${userId}/budgets/${budget.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'budgets', budget.id), {
      ...budget,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath, auth);
  }
}

export async function deleteBudgetFromFirestore(userId: string, budgetId: string): Promise<void> {
  if (!db) return;
  const docPath = `users/${userId}/budgets/${budgetId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'budgets', budgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath, auth);
  }
}

export async function syncSavingsGoalToFirestore(userId: string, goal: SavingsGoal): Promise<void> {
  if (!db) return;
  const docPath = `users/${userId}/savingsGoals/${goal.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'savingsGoals', goal.id), {
      ...goal,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath, auth);
  }
}

export async function deleteSavingsGoalFromFirestore(userId: string, goalId: string): Promise<void> {
  if (!db) return;
  const docPath = `users/${userId}/savingsGoals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'savingsGoals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath, auth);
  }
}

export async function syncSettingsToFirestore(userId: string, settings: UserSettings): Promise<void> {
  if (!db) return;
  const docPath = `users/${userId}/settings/preferences`;
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'preferences'), {
      ...settings,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath, auth);
  }
}

export function subscribeToUserTransactions(
  userId: string,
  onData: (transactions: Transaction[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!db) return null;
  const colPath = `users/${userId}/transactions`;
  const q = collection(db, 'users', userId, 'transactions');

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((doc) => {
        items.push({ ...(doc.data() as Transaction), id: doc.id });
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath, auth);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export function subscribeToUserBudgets(
  userId: string,
  onData: (budgets: Budget[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!db) return null;
  const colPath = `users/${userId}/budgets`;
  const q = collection(db, 'users', userId, 'budgets');

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Budget[] = [];
      snapshot.forEach((doc) => {
        items.push({ ...(doc.data() as Budget), id: doc.id });
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath, auth);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}

export function subscribeToUserGoals(
  userId: string,
  onData: (goals: SavingsGoal[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  if (!db) return null;
  const colPath = `users/${userId}/savingsGoals`;
  const q = collection(db, 'users', userId, 'savingsGoals');

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavingsGoal[] = [];
      snapshot.forEach((doc) => {
        items.push({ ...(doc.data() as SavingsGoal), id: doc.id });
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath, auth);
      } catch (err: any) {
        if (onError) onError(err);
      }
    }
  );
}
