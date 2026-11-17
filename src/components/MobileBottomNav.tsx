import React from 'react';
import { LayoutDashboard, ReceiptText, Target, BarChart3, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ViewTab } from '../types';

interface MobileBottomNavProps {
  onOpenAddModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenAddModal }) => {
  const { activeTab, setActiveTab } = useFinance();

  const leftNavButtons: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'Records', icon: <ReceiptText className="w-5 h-5" /> },
  ];

  const rightNavButtons: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'budgets', label: 'Budgets', icon: <Target className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-card-elevated border-t border-slate-200/80 dark:border-white/[0.08] px-3 py-1.5 safe-bottom">
      <div className="grid grid-cols-5 items-center max-w-md mx-auto">
        {leftNavButtons.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl text-[10px] font-medium transition ${
                isActive
                  ? 'text-[#103b2a] dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}

        {/* Center Floating Action Button */}
        <div className="flex items-center justify-center relative">
          <button
            onClick={onOpenAddModal}
            aria-label="Add new transaction"
            className="w-13 h-13 -mt-6 rounded-full bg-gradient-to-tr from-[#103b2a] to-emerald-600 dark:from-emerald-500 dark:to-teal-400 text-white dark:text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-950/35 dark:shadow-emerald-500/35 ring-4 ring-[#f5f6f2] dark:ring-[#060d0b] active:scale-95 transition"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {rightNavButtons.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 rounded-xl text-[10px] font-medium transition ${
                isActive
                  ? 'text-[#103b2a] dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
