import React from 'react';
import { X, Share, PlusSquare, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install, isIOS } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl glass-card-elevated p-6 text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">
              {isIOS ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Install Smart Expense</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">PWA for Desktop, Android &amp; iOS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="p-4 rounded-2xl glass-well space-y-2.5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              iPhone &amp; iPad (Safari)
            </h4>
            <ol className="space-y-1.5 text-slate-600 dark:text-slate-300 list-decimal list-inside pl-1">
              <li>
                Tap <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5" /> Share</strong> in Safari.
              </li>
              <li>
                Select <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong className="text-slate-900 dark:text-white">Add</strong> to launch standalone offline.
              </li>
            </ol>
          </div>

          <div className="p-4 rounded-2xl glass-well space-y-2.5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Android &amp; Desktop (Chrome / Edge)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1 text-[11px]">
              <li>Open the browser menu (⋮) or address bar install icon.</li>
              <li>Choose <strong className="text-slate-900 dark:text-white">&quot;Install Smart Expense&quot;</strong>.</li>
            </ol>
            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                  onClose();
                }}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#103b2a] dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Install App Now
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold glass-well text-slate-700 dark:text-slate-200 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
