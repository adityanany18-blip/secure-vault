import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  FolderLock,
  Share2,
  Users,
  ScrollText,
  BarChart3,
  Settings,
  UserCheck,
  LogOut,
  Upload,
  Lock,
  Layers,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../common/Badge';

interface SidebarProps {
  onUploadClick?: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onUploadClick,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user, logout, isAdmin, isEditor, isViewer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-royal text-white shadow-card font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  const roleBadgeVariant = isAdmin ? 'primary' : isEditor ? 'secondary' : 'success';

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-navy-900 border-r border-slate-200/80 dark:border-navy-800 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 dark:border-navy-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-royal to-accent flex items-center justify-center text-white shadow-glow">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                Secure<span className="text-royal">Vault</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-400">Zero-Trust Enterprise</p>
            </div>
          </div>

          {/* User Role Card */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Role</span>
              <Badge variant={roleBadgeVariant} size="sm">
                {user?.role}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
              {user?.name}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {/* Quick Upload Button for Admin & Editor */}
          {!isViewer && onUploadClick && (
            <button
              onClick={() => {
                setMobileOpen(false);
                onUploadClick();
              }}
              className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-royal hover:bg-royal-600 text-white text-sm font-semibold shadow-card hover:shadow-glow transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Encrypted File
            </button>
          )}

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 pb-1">
            Navigation
          </div>

          <NavLink to="/dashboard" onClick={() => setMobileOpen(false)} className={navItemClass}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </NavLink>

          <NavLink to="/files" onClick={() => setMobileOpen(false)} className={navItemClass}>
            <FolderLock className="w-4 h-4" />
            {isAdmin ? 'All Files' : isEditor ? 'My Files' : 'Accessible Files'}
          </NavLink>

          <NavLink to="/files?filter=shared-with-me" onClick={() => setMobileOpen(false)} className={navItemClass}>
            <Share2 className="w-4 h-4" />
            Shared With Me
          </NavLink>

          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">
                Administration
              </div>

              <NavLink to="/crypto-studio" onClick={() => setMobileOpen(false)} className={navItemClass}>
                <KeyRound className="w-4 h-4" />
                Crypto Studio (AES-256)
              </NavLink>

              <NavLink to="/users" onClick={() => setMobileOpen(false)} className={navItemClass}>
                <Users className="w-4 h-4" />
                User Management
              </NavLink>

              <NavLink to="/audit-logs" onClick={() => setMobileOpen(false)} className={navItemClass}>
                <ScrollText className="w-4 h-4" />
                Audit Logs
              </NavLink>

              <NavLink to="/reports" onClick={() => setMobileOpen(false)} className={navItemClass}>
                <BarChart3 className="w-4 h-4" />
                Security & Reports
              </NavLink>
            </>
          )}

          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1">
            Account
          </div>

          <NavLink to="/profile" onClick={() => setMobileOpen(false)} className={navItemClass}>
            <UserCheck className="w-4 h-4" />
            Profile & Security
          </NavLink>

          <NavLink to="/settings" onClick={() => setMobileOpen(false)} className={navItemClass}>
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-navy-800 space-y-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-navy-800/40">
            <Lock className="w-3.5 h-3.5 text-royal" />
            <span>AES-256 Hardware Encrypted</span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

