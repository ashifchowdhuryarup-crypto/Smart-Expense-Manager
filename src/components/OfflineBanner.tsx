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
    <aside aria-label="Connection and sync status" className="w-full bg-slate-900/95 backdrop-blur border-b border-slate-800/80 px-3.5 py-1.5 text-xs transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          {!isOnline ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-medium truncate">
              <WifiOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              <span className="truncate">Offline Mode &mdash; Saved locally</span>
            </span>
          ) : isSyncing ? (
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium truncate">
              <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
              <span className="truncate">Syncing to cloud...</span>
            </span>
          ) : pendingSyncCount > 0 ? (
            <span className="flex items-center gap-1.5 text-sky-400 font-medium truncate">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{pendingSyncCount} unsynced {pendingSyncCount === 1 ? 'change' : 'changes'} stored locally</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium truncate">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Cloud synced {lastSyncTime ? `(${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pendingSyncCount > 0 && isOnline && user && (
            <button
              onClick={() => triggerSyncNow()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] shadow-sm transition disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          )}

          {!user && pendingSyncCount > 0 && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Sign in to sync across devices
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
