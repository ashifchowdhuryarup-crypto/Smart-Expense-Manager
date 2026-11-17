import React, { useState } from 'react';
import {
  Settings,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  LogIn,
  LogOut,
  User as UserIcon,
  Smartphone,
  Sun,
  Moon,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { testFirestoreConnection, getLoadedFirebaseConfig } from '../services/firebase';
import { SupportedCurrency } from '../types';

interface SettingsViewProps {
  onOpenIOSGuide: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenIOSGuide }) => {
  const {
    currency,
    setCurrency,
    transactions,
    budgets,
    savingsGoals,
    importData,
    clearAllData,
    pendingSyncCount,
    triggerSyncNow,
    isSyncing,
    isOnline,
    lastSyncTime,
  } = useFinance();

  const { user, isFirebaseConfigured, signIn, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [projectIdInput, setProjectIdInput] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const activeFirebaseConfig = getLoadedFirebaseConfig();

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await testFirestoreConnection();
      setConnectionResult(res);
    } catch (e: any) {
      setConnectionResult({ success: false, message: e?.message || 'Error checking connection' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCustomFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || !projectIdInput.trim()) return;

    const custom = {
      apiKey: apiKeyInput.trim(),
      projectId: projectIdInput.trim(),
      authDomain: `${projectIdInput.trim()}.firebaseapp.com`,
      appId: '1:123456789:web:abcdef',
    };

    localStorage.setItem('smart_expense_firebase_config', JSON.stringify(custom));
    window.location.reload();
  };

  const handleExportJSON = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      currency,
      transactions,
      budgets,
      savingsGoals,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart_expense_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        await importData({
          transactions: parsed.transactions,
          budgets: parsed.budgets,
          goals: parsed.savingsGoals || parsed.goals,
        });
        if (parsed.currency) {
          setCurrency(parsed.currency);
        }
        setImportMessage('Backup data imported successfully!');
        setTimeout(() => setImportMessage(null), 4000);
      } catch (err: any) {
        setImportMessage(`Import error: ${err?.message || 'Invalid JSON file'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Settings &amp; Cloud Sync
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your Firebase synchronization, Google account, theme, currency, and backups
        </p>
      </div>

      {/* 1. Firebase Cloud Sync Status */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isFirebaseConfigured
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Firebase &amp; Firestore Cloud Status
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFirebaseConfigured ? 'Firebase SDK initialized' : 'Local IndexedDB offline mode active'}
              </p>
            </div>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="px-3.5 py-2 rounded-xl glass-well hover:border-emerald-500/40 text-xs text-slate-800 dark:text-slate-200 font-semibold transition flex items-center gap-1.5 disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
            Test Connection
          </button>
        </div>

        {connectionResult && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
              connectionResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
            }`}
          >
            {connectionResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{connectionResult.message}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl glass-well text-xs space-y-2.5">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">Project ID:</span>
            <span className="font-mono text-slate-900 dark:text-slate-200 truncate">
              {activeFirebaseConfig?.projectId || 'Not set (offline storage)'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500 dark:text-slate-400">Auth Domain:</span>
            <span className="font-mono text-slate-900 dark:text-slate-200 truncate">
              {activeFirebaseConfig?.authDomain || 'None'}
            </span>
          </div>
          <div className="flex justify-between items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 shrink-0">Current App Domain:</span>
            <div className="flex items-center gap-1.5 font-mono text-emerald-700 dark:text-emerald-400 min-w-0">
              <span className="truncate">{typeof window !== 'undefined' ? window.location.hostname : 'localhost'}</span>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(window.location.hostname);
                    setCopiedDomain(true);
                    setTimeout(() => setCopiedDomain(false), 1800);
                  }
                }}
                className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/[0.08] text-[10px] text-slate-700 dark:text-slate-300 transition shrink-0"
              >
                {copiedDomain ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Offline Queue:</span>
            <span className="text-slate-900 dark:text-slate-200 font-bold tabular-nums">
              {pendingSyncCount} unsynced items
            </span>
          </div>
          {lastSyncTime && (
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Last Sync Time:</span>
              <span className="text-slate-700 dark:text-slate-300">{lastSyncTime.toLocaleString()}</span>
            </div>
          )}
        </div>

        {pendingSyncCount > 0 && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300">
            <span>You have {pendingSyncCount} actions queued locally.</span>
            <button
              onClick={() => triggerSyncNow()}
              disabled={isSyncing || !isOnline}
              className="px-3.5 py-1.5 rounded-xl bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 font-bold transition"
            >
              {isSyncing ? 'Syncing...' : 'Flush to Cloud'}
            </button>
          </div>
        )}

        <div>
          <button
            onClick={() => setShowConfigForm(!showConfigForm)}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
          >
            {showConfigForm ? 'Hide Custom Firebase Setup' : 'Configure Custom Firebase Project'}
          </button>

          {showConfigForm && (
            <form onSubmit={handleSaveCustomFirebase} className="mt-3 p-4 rounded-2xl glass-well space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">API Key</label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  required
                  className="w-full px-3 py-2 rounded-xl glass-card text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Project ID</label>
                <input
                  type="text"
                  value={projectIdInput}
                  onChange={(e) => setProjectIdInput(e.target.value)}
                  placeholder="my-expense-project"
                  required
                  className="w-full px-3 py-2 rounded-xl glass-card text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold"
                >
                  Save &amp; Connect
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 2. Google Authentication */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Google Account Authentication</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sync expenses across mobile and desktop devices</p>
          </div>
        </div>

        {user ? (
          <div className="p-4 rounded-2xl glass-well flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">
                  {user.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
              )}
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">{user.displayName || 'Google User'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
                <span className="inline-block mt-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                  ✓ Verified Account
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 rounded-xl glass-card hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl glass-well flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Local / Guest Mode Active</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Records are stored in your device&apos;s IndexedDB. Sign in with Google to enable cloud sync.
              </p>
            </div>

            <button
              onClick={() => signIn()}
              className="px-4 py-2.5 rounded-xl bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold shadow-md transition flex items-center justify-center gap-2 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* 3. General Preferences */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Preferences &amp; Display</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-well text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="BDT" className="bg-white dark:bg-slate-900">৳ Bangladeshi Taka (BDT)</option>
              <option value="USD" className="bg-white dark:bg-slate-900">$ US Dollar (USD)</option>
              <option value="EUR" className="bg-white dark:bg-slate-900">€ Euro (EUR)</option>
              <option value="GBP" className="bg-white dark:bg-slate-900">£ British Pound (GBP)</option>
              <option value="INR" className="bg-white dark:bg-slate-900">₹ Indian Rupee (INR)</option>
            </select>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              Updates currency symbol across all dashboards &amp; charts.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Theme Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  theme === 'dark'
                    ? 'bg-[#103b2a] dark:bg-emerald-500/20 border-emerald-500 text-white dark:text-emerald-300 shadow-sm'
                    : 'glass-well text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Glass</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  theme === 'light'
                    ? 'bg-[#103b2a] border-[#103b2a] text-white shadow-sm'
                    : 'glass-well text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light Ivory</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PWA Installation */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Progressive Web App (PWA)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isInstalled
                  ? 'Running as an installed standalone application.'
                  : 'Install on Desktop, Android, or iOS for offline access.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="px-3.5 py-2 rounded-xl bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 text-xs font-bold shadow-md transition"
              >
                Install App
              </button>
            )}
            {!isInstalled && (
              <button
                onClick={onOpenIOSGuide}
                className="px-3.5 py-2 rounded-xl glass-well text-xs text-slate-700 dark:text-slate-200 font-semibold transition"
              >
                Install Guide
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Data Management & Backups */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Management &amp; Backup</h2>

        {importMessage && (
          <div className="p-3 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
            {importMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-well hover:border-emerald-500/40 text-xs font-semibold text-slate-800 dark:text-white transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Export JSON Backup
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-well hover:border-emerald-500/40 text-xs font-semibold text-slate-800 dark:text-white cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Import JSON Backup
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to permanently delete all local financial records, budgets, and savings goals?'
                )
              ) {
                clearAllData();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-well hover:bg-rose-500/15 text-xs font-semibold text-rose-600 dark:text-rose-400 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear Local Data
          </button>
        </div>
      </div>
    </div>
  );
};
