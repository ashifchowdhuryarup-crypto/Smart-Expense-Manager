import React from 'react';
import { LayoutDashboard, ReceiptText, Target, BarChart3, Settings, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ViewTab } from '../types';

interface MobileBottomNavProps {
  onOpenAddModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenAddModal }) => {
  const { activeTab, setActiveTab } = useFinance();

  const navButtons: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'transactions', label: 'Records', icon: <ReceiptText className="w-5 h-5" /> },
    { id: 'budgets', label: 'Budgets', icon: <Target className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto relative">
        {navButtons.slice(0, 2).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}

        {/* Center Floating Action Button */}
        <div className="relative -top-5">
          <button
            onClick={onOpenAddModal}
            aria-label="Add new transaction"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 border-2 border-slate-950 active:scale-95 transition"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {navButtons.slice(2).map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-medium transition ${
                isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span className="mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
