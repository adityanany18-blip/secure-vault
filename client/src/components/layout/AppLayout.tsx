import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { FileUploadModal } from '../files/FileUploadModal';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/crypto-studio')) return 'Cryptographic Studio (AES-256-GCM)';
    if (path.startsWith('/files')) return 'Encrypted Vault Files';
    if (path.startsWith('/users')) return 'User & Role Management';
    if (path.startsWith('/audit-logs')) return 'Security Audit Logs';
    if (path.startsWith('/reports')) return 'Security Reports & Analytics';
    if (path.startsWith('/profile')) return 'Profile & Credentials';
    if (path.startsWith('/settings')) return 'System Settings';
    return 'SecureVault';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B0F19] transition-colors flex">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onUploadClick={() => setUploadModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-800 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
              {getPageTitle()}
            </h2>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-royal text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {notificationOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNotificationOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-2xl z-50 overflow-hidden animate-in fade-in duration-200">
                    <div className="p-4 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          Notifications
                        </h4>
                        {unreadCount > 0 && (
                          <span className="text-[11px] font-semibold bg-royal/10 text-royal px-2 py-0.5 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-royal hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-navy-800">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) {
                                navigate(n.link);
                                setNotificationOpen(false);
                              }
                            }}
                            className={`p-3.5 hover:bg-slate-50 dark:hover:bg-navy-800/60 cursor-pointer transition-colors ${
                              !n.read ? 'bg-royal-50/50 dark:bg-royal-950/20' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="mt-0.5">
                                {n.type === 'SUCCESS' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : n.type === 'WARNING' || n.type === 'ERROR' ? (
                                  <AlertCircle className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <Info className="w-4 h-4 text-royal" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                  {n.title}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Avatar & Name */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-navy-800">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-royal to-accent text-white flex items-center justify-center text-xs font-bold shadow-sm">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-[10px] font-medium text-slate-400 capitalize">
                  {user?.role.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet context={{ openUploadModal: () => setUploadModalOpen(true) }} />
        </main>
      </div>

      {/* Global File Upload Modal */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          setUploadModalOpen(false);
          // If user is currently on /files, trigger reload or notification
        }}
      />
    </div>
  );
};

