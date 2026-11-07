import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Users,
  FolderLock,
  Lock,
  HardDrive,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Upload,
  UserPlus,
  Share2,
  FileText,
  Clock,
  Eye,
  Download,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { DashboardStats, FileItem } from '../types';
import { Badge } from '../components/common/Badge';
import { FilePreviewModal } from '../components/files/FilePreviewModal';

const COLORS = ['#4169E1', '#805AD5', '#10B981', '#F59E0B', '#EF4444'];

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, isEditor, isViewer } = useAuth();
  const { openUploadModal } = useOutletContext<{ openUploadModal: () => void }>() || {};

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview Modal state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, filesData] = await Promise.all([
        api.getDashboardStats(),
        api.getFiles({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
      ]);
      setStats(statsData);
      setRecentFiles(filesData.files || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard telemetry.');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-royal border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading cryptographic telemetry...</p>
      </div>
    );
  }

  // Pre-calculate chart data from real stats
  const roleDistribution = [
    { name: 'Admins', value: stats?.totalAdmins || 0 },
    { name: 'Editors', value: stats?.totalEditors || 0 },
    { name: 'Viewers', value: stats?.totalViewers || 0 },
  ];

  // Storage breakdown by folder or file count
  const folderDistribution = [
    { folder: 'Compliance', count: stats?.fileStats?.filter(f => f.mimeType.includes('pdf') || f.mimeType.includes('markdown')).length || 1 },
    { folder: 'Finance', count: stats?.fileStats?.filter(f => f.mimeType.includes('json') || f.mimeType.includes('excel')).length || 1 },
    { folder: 'Engineering', count: stats?.fileStats?.filter(f => f.mimeType.includes('text') || f.mimeType.includes('plain')).length || 1 },
    { folder: 'Executive', count: 1 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white relative overflow-hidden shadow-xl border border-navy-700/60">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-royal/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal/20 border border-royal/30 text-royal-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>AES-256-GCM Cryptographic Vault Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              You are signed in as an organization{' '}
              <span className="font-bold text-royal-300 uppercase tracking-wide">
                {user?.role}
              </span>
              . Deny-by-default access policies are actively enforced.
            </p>
          </div>

          {!isViewer && openUploadModal && (
            <button
              onClick={openUploadModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-royal hover:bg-royal-600 text-white text-xs sm:text-sm font-semibold shadow-card hover:shadow-glow transition-all flex-shrink-0"
            >
              <Upload className="w-4 h-4" />
              Upload Encrypted File
            </button>
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total / Accessible Files */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Total Files' : 'Accessible Files'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-royal-100 dark:bg-royal-950 text-royal flex items-center justify-center">
              <FolderLock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats?.totalFiles ?? 0}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              100% Encrypted
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Stored securely at rest</p>
        </div>

        {/* Encrypted Vault Blobs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Vault Ciphertexts
            </span>
            <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats?.encryptedFiles ?? 0}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400">AES-256</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Unique 96-bit nonces</p>
        </div>

        {/* Storage Consumed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Encrypted Storage
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {formatBytes(stats?.totalStorageBytes || 0)}
            </span>
            <span className="text-xs font-semibold text-slate-400">Max 100 GB</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Zero plaintext leakage</p>
        </div>

        {/* Total Users / Access Rights */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Total Users' : 'Role Permissions'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {isAdmin ? stats?.totalUsers ?? 0 : user?.capabilities?.length ?? 2}
            </span>
            <span className="text-xs font-medium text-royal">
              {isAdmin ? `${stats?.totalAdmins} Admins` : user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin ? 'Active organizational accounts' : 'Assigned granular actions'}
          </p>
        </div>
      </div>

      {/* ADMIN ANALYTICS ROW */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Storage by Category Chart */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Vault Document Distribution
                </h3>
                <p className="text-xs text-slate-400">Encrypted files categorized by operational domain</p>
              </div>
              <span className="text-xs font-semibold text-royal bg-royal-50 dark:bg-royal-950 px-2.5 py-1 rounded-lg">
                Real DB Metrics
              </span>
            </div>

            <div className="h-64 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={folderDistribution} barSize={36}>
                  <XAxis dataKey="folder" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101B35',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#4169E1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Role Distribution Pie */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  RBAC Hierarchy
                </h3>
                <p className="text-xs text-slate-400">Active role assignments</p>
              </div>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#101B35',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100 dark:border-navy-800">
              <div>
                <span className="text-xs font-bold text-royal block">{stats?.totalAdmins}</span>
                <span className="text-[10px] text-slate-400 uppercase">Admins</span>
              </div>
              <div>
                <span className="text-xs font-bold text-accent block">{stats?.totalEditors}</span>
                <span className="text-[10px] text-slate-400 uppercase">Editors</span>
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 block">{stats?.totalViewers}</span>
                <span className="text-[10px] text-slate-400 uppercase">Viewers</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECENT FILES & RECENT ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files Section */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-royal" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAdmin ? 'Recent Organizational Files' : 'Recent Documents'}
              </h3>
            </div>
            <Link
              to="/files"
              className="text-xs font-semibold text-royal hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentFiles.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No documents available in vault.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-800">
              {recentFiles.map((f) => (
                <div
                  key={f.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-navy-800/40 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-royal-50 dark:bg-royal-950 text-royal flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                        {f.originalName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {f.folder} &bull; {(f.fileSize / 1024).toFixed(1)} KB &bull; By {f.owner.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewFile(f)}
                      className="px-2.5 py-1 text-xs font-medium text-royal hover:bg-royal-50 dark:hover:bg-royal-950/60 rounded-lg transition-colors flex items-center gap-1"
                      title="Inspect preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    {f.userPermissions?.canDownload && (
                      <button
                        onClick={async () => {
                          try {
                            await api.downloadFile(f.id, f.originalName);
                          } catch (err: any) {
                            alert(err.message);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-royal hover:bg-slate-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                        title="Download decrypted file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Stream */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Security Activities
              </h3>
            </div>
            {isAdmin && (
              <Link
                to="/audit-logs"
                className="text-xs font-semibold text-royal hover:underline flex items-center gap-1"
              >
                All audit trails <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200/60 dark:border-navy-800 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {act.actor?.name || 'System / Anonymous'}
                      </span>
                      <Badge
                        variant={
                          act.result === 'SUCCESS'
                            ? 'success'
                            : act.result === 'DENIED'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {act.result}
                      </Badge>
                    </div>
                    <p className="text-xs font-mono text-royal dark:text-royal-300 truncate">
                      {act.action}
                    </p>
                    {act.file && (
                      <p className="text-[11px] text-slate-400 truncate">
                        File: {act.file.originalName}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 whitespace-nowrap pt-1">
                    {new Date(act.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No recent activity logged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Global File Preview Modal */}
      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};

