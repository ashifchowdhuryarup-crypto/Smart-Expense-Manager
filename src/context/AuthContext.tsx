import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, getLoadedFirebaseConfig } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  isGuest: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('smart_expense_is_guest') === 'true';
  });
  const [error, setError] = useState<string | null>(null);
  const [isFirebaseConfigured, setIsFirebaseConfigured] = useState<boolean>(() => {
    return !!getLoadedFirebaseConfig();
  });

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setIsFirebaseConfigured(false);
      return;
    }

    setIsFirebaseConfigured(true);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('smart_expense_is_guest');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      setError('Firebase configuration is required for cloud Google Sign-In.');
      return;
    }
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        setUser(loggedUser);
        setIsGuest(false);
        localStorage.removeItem('smart_expense_is_guest');
      }
    } catch (err: any) {
      // User-friendly error message without unhandled exception
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setError('Sign-in cancelled.');
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site or open in a new tab.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized in Firebase Console. Add your current URL under Firebase Console > Authentication > Settings > Authorized domains.');
      } else {
        setError(err?.message || 'Google Sign-In encountered an error. Please try again.');
      }
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setIsGuest(true);
      localStorage.setItem('smart_expense_is_guest', 'true');
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('smart_expense_is_guest', 'true');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseConfigured,
        isGuest,
        signIn,
        signOut,
        continueAsGuest,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
