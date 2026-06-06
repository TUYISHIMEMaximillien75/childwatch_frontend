import { useState } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function InstallPrompt() {
  const [closed, setClosed] = useState(false);
  const { installPrompt, promptInstall } = useInstallPrompt();

  if (!installPrompt || closed) return null;

  const handleInstallClick = async () => {
    await promptInstall();
    setClosed(true);
  };

  const handleClose = () => {
    setClosed(true);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-top-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
          <img src="/pwa-192x192.png" alt="App Icon" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Install Childwatch</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Install the app on your device for a faster, offline-capable experience.
          </p>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
          <button
            onClick={handleClose}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
