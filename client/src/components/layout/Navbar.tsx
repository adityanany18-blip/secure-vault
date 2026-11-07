import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Menu, X, Moon, Sun, ArrowRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-navy-950/80 backdrop-blur-md border-b border-slate-200/60 dark:border-navy-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal to-accent flex items-center justify-center text-white shadow-glow group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Secure<span className="text-royal">Vault</span>
                <span className="text-[10px] uppercase font-semibold bg-royal-100 dark:bg-royal-950 text-royal-600 dark:text-royal-400 px-1.5 py-0.5 rounded border border-royal-200 dark:border-royal-800">
                  AES-256
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-royal-400 transition-colors">
              Features
            </a>
            <a href="#architecture" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-royal-400 transition-colors">
              Security Architecture
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-royal-400 transition-colors">
              How It Works
            </a>
            <a href="#faq" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-royal dark:hover:text-royal-400 transition-colors">
              FAQ
            </a>
          </div>

          {/* Actions & Theme */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-royal hover:bg-royal-600 rounded-xl shadow-card transition-all hover:shadow-glow"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-royal dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-royal hover:bg-royal-600 rounded-xl shadow-card transition-all hover:shadow-glow"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 px-4 pt-2 pb-6 space-y-3">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 rounded-lg"
          >
            Features
          </a>
          <a
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 rounded-lg"
          >
            Security Architecture
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-800 rounded-lg"
          >
            How It Works
          </a>
          <div className="pt-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white bg-royal font-semibold text-center"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block w-full py-2.5 px-4 rounded-xl text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-navy-800 font-semibold text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block w-full py-2.5 px-4 rounded-xl text-white bg-royal font-semibold text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

