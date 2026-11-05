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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              {isIOS ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">Install Smart Expense</h3>
              <p className="text-xs text-slate-400">PWA for Windows, Android, and iOS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* iOS Safari Guide */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              iPhone & iPad (Safari)
            </h4>
            <ol className="space-y-2 text-slate-300 list-decimal list-inside pl-1">
              <li className="leading-relaxed">
                Tap the <strong className="text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5" /> Share</strong> icon in your Safari bottom navigation bar.
              </li>
              <li className="leading-relaxed">
                Scroll down and select <strong className="text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
              </li>
              <li className="leading-relaxed">
                Tap <strong className="text-white">Add</strong> in the top-right corner. The app will launch standalone with offline access!
              </li>
            </ol>
          </div>

          {/* Android / Windows Chrome / Edge Guide */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              Windows, Mac & Android (Chrome / Edge)
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Click the install icon in the URL address bar or click the button below to install directly to your device desktop or home screen.
            </p>
            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Prompt Install Now
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
