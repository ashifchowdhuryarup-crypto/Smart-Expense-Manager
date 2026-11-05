import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

export const OfflineBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingSyncCount, lastSyncTime, triggerSyncNow } = useFinance();
  const { user } = useAuth();

  if (isOnline && pendingSyncCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <aside aria-label="Connection and sync status" className="w-full bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-2 text-xs transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <WifiOff className="w-4 h-4 animate-pulse" />
              <span>Offline Mode &mdash; Saving changes locally in IndexedDB.</span>
            </span>
          ) : isSyncing ? (
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Synchronizing transactions with Firestore cloud...</span>
            </span>
          ) : pendingSyncCount > 0 ? (
            <span className="flex items-center gap-1.5 text-sky-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              <span>{pendingSyncCount} unsynced {pendingSyncCount === 1 ? 'change' : 'changes'} stored locally.</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Cloud synchronized {lastSyncTime ? `(${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {pendingSyncCount > 0 && isOnline && user && (
            <button
              onClick={() => triggerSyncNow()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Now
            </button>
          )}

          {!user && (
            <span className="text-slate-400 hidden sm:inline">
              Sign in with Google to enable automatic cross-device sync.
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
