import React, { useState } from 'react';
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  Target,
  BarChart3,
  Settings,
  Plus,
  Sun,
  Moon,
  Download,
  LogIn,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ViewTab } from '../types';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenIOSGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal, onOpenIOSGuide }) => {
  const { activeTab, setActiveTab, isOnline, isSyncing, pendingSyncCount } = useFinance();
  const { user, signIn, signOut, isFirebaseConfigured, isGuest } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <ReceiptText className="w-4 h-4" /> },
    { id: 'budgets', label: 'Budgets & Goals', icon: <Target className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn();
    } catch {
      // Handled in context
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shadow-lg shadow-emerald-500/10 group-hover:scale-105 group-hover:border-emerald-500/30 transition overflow-hidden">
                <img
                  src="/assets/aistudio/calculation_e775ab51.png"
                  alt="Smart Expense Manager Logo"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent block">
                  Smart Expense
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider uppercase block -mt-1 font-mono">
                  Manager PWA
                </span>
              </div>
            </button>

            {/* Sync Badge */}
            <div className="hidden lg:flex items-center ml-2">
              {!isOnline ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              ) : isSyncing ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
                </span>
              ) : user ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Synced
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  Local Mode
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2">
            {/* PWA Install Button */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                title="Install Smart Expense as desktop or mobile app"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={onOpenIOSGuide}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                title="Install on iPhone / iPad"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install on iOS</span>
              </button>
            )}

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light theme"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Google Authentication Button / User Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className="flex items-center gap-2 p-1 rounded-full border border-slate-700 hover:border-slate-500 transition focus:outline-none"
                  aria-label="User account menu"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 text-xs">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="font-semibold text-slate-200 truncate">{user.displayName || 'Google Account'}</p>
                      <p className="text-slate-400 text-[11px] truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">
                        Cloud Sync Active
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Sync & Preferences
                    </button>

                    <button
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isSigningIn}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
                title="Sign in with Google"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isSigningIn ? 'Connecting...' : 'Google Sign-In'}</span>
              </button>
            )}

            {/* Quick Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Transaction</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
