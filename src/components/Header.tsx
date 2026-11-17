import React, { useState } from 'react';
import {
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
  const { activeTab, setActiveTab, isOnline, isSyncing } = useFinance();
  const { user, signIn, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'transactions', label: 'Records', icon: <ReceiptText className="w-4 h-4" /> },
    { id: 'budgets', label: 'Budgets', icon: <Target className="w-4 h-4" /> },
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
    <header className="sticky top-0 z-40 glass-card-elevated border-b border-slate-200/80 dark:border-white/[0.07] transition-colors">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group min-w-0"
            >
              <div className="w-9 h-9 rounded-xl glass-well flex items-center justify-center p-1 shadow-sm group-hover:scale-105 transition overflow-hidden shrink-0">
                <img
                  src="/assets/aistudio/calculation_e775ab51.png"
                  alt="Smart Expense Manager Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white block truncate">
                  Smart Expense
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 tracking-wider uppercase block -mt-0.5 font-mono">
                  Personal Vault
                </span>
              </div>
            </button>

            {/* Sync Indicator */}
            <div className="hidden lg:flex items-center ml-1">
              {!isOnline ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              ) : isSyncing ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
                </span>
              ) : user ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Cloud Synced
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium glass-well text-slate-600 dark:text-slate-300">
                  Local Vault
                </span>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 glass-well p-1 rounded-2xl">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#103b2a] dark:bg-emerald-500/90 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* PWA Install Button */}
            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) {
                    install();
                  } else {
                    onOpenIOSGuide();
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 text-xs font-semibold transition"
                title="Install Smart Expense as standalone app"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Install</span>
              </button>
            )}

            {!isInstalled && isIOS && (
              <button
                onClick={onOpenIOSGuide}
                className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/12 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 text-xs font-semibold transition"
                title="Install on iPhone / iPad"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark/light theme"
              className="w-9 h-9 rounded-xl glass-well flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-emerald-700" />
              )}
            </button>

            {/* Google Authentication Button / User Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu((prev) => !prev)}
                  className="flex items-center gap-2 p-0.5 rounded-full border border-emerald-500/30 hover:border-emerald-500/60 transition focus:outline-none"
                  aria-label="User account menu"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl glass-card-elevated py-2 z-50 text-xs">
                    <div className="px-4 py-2.5 border-b border-slate-200 dark:border-white/[0.08]">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">
                        {user.displayName || 'Google Account'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                        Cloud Sync Active
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/[0.05] flex items-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Sync & Preferences
                    </button>

                    <button
                      onClick={() => {
                        signOut();
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
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
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-500/12 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition"
                title="Sign in with Google"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isSigningIn ? 'Connecting...' : 'Sign In'}</span>
              </button>
            )}

            {/* Mobile Settings shortcut */}
            <button
              onClick={() => setActiveTab('settings')}
              aria-label="Settings and Preferences"
              className={`md:hidden w-9 h-9 rounded-xl glass-well flex items-center justify-center transition ${
                activeTab === 'settings'
                  ? 'text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Desktop Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#103b2a] hover:bg-[#165039] dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-bold shadow-lg shadow-emerald-950/20 dark:shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
