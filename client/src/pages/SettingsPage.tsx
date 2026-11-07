import React from 'react';
import {
  Settings,
  Shield,
  Key,
  Server,
  Database,
  Moon,
  Sun,
  Lock,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          System & Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Interface preferences and cryptographic engine configuration.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-6">
        {/* Appearance Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Appearance & Theme
          </h3>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Color Scheme
              </span>
              <span className="text-[11px] text-slate-400">
                Current mode: <strong className="capitalize">{theme}</strong>
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              Toggle to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* Security Parameters */}
        <div className="pt-6 border-t border-slate-100 dark:border-navy-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-royal" />
            Active Vault Parameters
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Encryption Standard</span>
              <span className="font-mono font-bold text-royal">AES-256-GCM (256-bit Key)</span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Nonce Initialization</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">96-bit CSPRNG</span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Integrity Tag</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">128-bit Authentication Tag</span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Credential Hash</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">Argon2id (m=19456, t=2)</span>
            </div>
            <div className="py-3 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Authorization Model</span>
              <span className="font-semibold text-emerald-600">Deny-by-Default ACL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

