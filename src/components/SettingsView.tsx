import React, { useState } from 'react';
import {
  Settings,
  Database,
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
  ShieldCheck,
  ExternalLink,
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
    resetToDemoData,
    pendingSyncCount,
    triggerSyncNow,
    isSyncing,
    isOnline,
    lastSyncTime,
  } = useFinance();

  const { user, isFirebaseConfigured, signIn, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [projectIdInput, setProjectIdInput] = useState('');
  const [authDomainInput, setAuthDomainInput] = useState('');
  const [appIdInput, setAppIdInput] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

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
      authDomain: authDomainInput.trim() || `${projectIdInput.trim()}.firebaseapp.com`,
      appId: appIdInput.trim() || '1:123456789:web:abcdef',
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-300" />
          Settings & Cloud Synchronization
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your Firebase credentials, Google account, offline database, and preferences
        </p>
      </div>

      {/* 1. Firebase Cloud Sync Status */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isFirebaseConfigured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Firebase & Firestore Cloud Status</h2>
              <p className="text-xs text-slate-400">
                {isFirebaseConfigured ? 'Firebase SDK initialized' : 'Local IndexedDB offline mode active'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              Test Connection
            </button>
          </div>
        </div>

        {connectionResult && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              connectionResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {connectionResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{connectionResult.message}</span>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Project ID:</span>
            <span className="font-mono text-slate-200">
              {activeFirebaseConfig?.projectId || 'Not set (using offline storage)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Auth Domain:</span>
            <span className="font-mono text-slate-200">
              {activeFirebaseConfig?.authDomain || 'None'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Offline Queue:</span>
            <span className="text-slate-200 font-semibold">
              {pendingSyncCount} unsynced items
            </span>
          </div>
          {lastSyncTime && (
            <div className="flex justify-between">
              <span className="text-slate-400">Last Sync Time:</span>
              <span className="text-slate-300">{lastSyncTime.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Offline Queue Manual Flush Button */}
        {pendingSyncCount > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
            <span>You have {pendingSyncCount} actions queued while offline.</span>
            <button
              onClick={() => triggerSyncNow()}
              disabled={isSyncing || !isOnline}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              {isSyncing ? 'Syncing...' : 'Flush to Firestore'}
            </button>
          </div>
        )}

        {/* Toggle Custom Config Form */}
        <div>
          <button
            onClick={() => setShowConfigForm(!showConfigForm)}
            className="text-xs text-indigo-400 hover:underline font-medium"
          >
            {showConfigForm ? 'Hide Firebase Setup Form' : 'Configure Custom Firebase Project (UI)'}
          </button>

          {showConfigForm && (
            <form onSubmit={handleSaveCustomFirebase} className="mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <p className="text-[11px] text-slate-400">
                You can also configure Firebase via <code className="text-emerald-400">.env</code> (e.g. <code className="text-emerald-400">VITE_FIREBASE_API_KEY</code>). Or paste keys here to persist in your browser:
              </p>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">API Key</label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">Project ID</label>
                <input
                  type="text"
                  value={projectIdInput}
                  onChange={(e) => setProjectIdInput(e.target.value)}
                  placeholder="my-expense-project"
                  required
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 2. Google Authentication */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Google Account Authentication</h2>
            <p className="text-xs text-slate-400">Sync expenses across all your mobile and desktop devices</p>
          </div>
        </div>

        {user ? (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                  {user.displayName ? user.displayName.charAt(0) : 'U'}
                </div>
              )}
              <div>
                <p className="font-semibold text-xs text-white">{user.displayName || 'Google User'}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
                <span className="inline-block mt-0.5 text-[10px] text-emerald-400 font-medium">
                  ✓ Verified Account
                </span>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold border border-slate-700 hover:border-rose-500/30 transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-white">You are currently using Local / Guest Mode</p>
              <p className="text-[11px] text-slate-400">
                Your records are stored securely in your browser's IndexedDB. Sign in with Google to sync with cloud.
              </p>
            </div>

            <button
              onClick={() => signIn()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* 3. General Preferences */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white">Preferences & Display</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="BDT">৳ Bangladeshi Taka (BDT)</option>
              <option value="USD">$ US Dollar (USD)</option>
              <option value="EUR">€ Euro (EUR)</option>
              <option value="GBP">£ British Pound (GBP)</option>
              <option value="INR">₹ Indian Rupee (INR)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Changes the currency symbol across the entire app.</p>
          </div>

          {/* Theme Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Theme Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleTheme()}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                  theme === 'dark'
                    ? 'bg-slate-950 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Dark Mode
              </button>
              <button
                type="button"
                onClick={() => toggleTheme()}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                  theme === 'light'
                    ? 'bg-slate-950 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Light Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PWA Installation */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Progressive Web App (PWA)</h2>
              <p className="text-xs text-slate-400">
                {isInstalled
                  ? 'Currently running as an installed native app.'
                  : 'Install on Windows, Android or iOS for offline access.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition"
              >
                Install App
              </button>
            )}

            {!isInstalled && (
              <button
                onClick={onOpenIOSGuide}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
              >
                iOS Instructions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Data Management & Backups */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white">Data Management & Backup</h2>

        {importMessage && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
            {importMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Export JSON Backup
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Import JSON Backup
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Reset all financial data back to starter demo transactions?')) {
                resetToDemoData();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
