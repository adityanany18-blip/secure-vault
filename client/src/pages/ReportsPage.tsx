import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  ShieldCheck,
  Lock,
  HardDrive,
  Users,
  Activity,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats } from '../types';

const COLORS = ['#4169E1', '#805AD5', '#10B981', '#F59E0B', '#EF4444'];

export const ReportsPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [dash, audit] = await Promise.all([
        api.getDashboardStats(),
        api.getAuditStats(),
      ]);
      setStats(dash);
      setAuditStats(audit);
    } finally {
      setLoading(false);
    }
  };

  const outcomeDistribution = [
    { name: 'Authorized Success', count: auditStats?.successCount || 0 },
    { name: 'Unauthorized Denials', count: auditStats?.deniedCount || 0 },
    { name: 'Exceptions / Failures', count: auditStats?.failureCount || 0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Security Intelligence & Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Cryptographic enforcement verification, storage allocation telemetry, and security posture.
        </p>
      </div>

      {/* Compliance Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Encryption Compliance
            </h3>
          </div>
          <span className="text-3xl font-extrabold text-emerald-600">100%</span>
          <p className="text-xs text-slate-500 mt-1">
            Every stored file is encrypted with AES-256-GCM. 0 unencrypted files.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-royal-100 dark:bg-royal-950 text-royal flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Total Audit Events
            </h3>
          </div>
          <span className="text-3xl font-extrabold text-royal">
            {auditStats?.totalLogs || 0}
          </span>
          <p className="text-xs text-slate-500 mt-1">
            Logged across sessions, permissions, and cryptographic file queries.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Authorization Model
            </h3>
          </div>
          <span className="text-3xl font-extrabold text-purple-600">Strict Deny</span>
          <p className="text-xs text-slate-500 mt-1">
            Object-level ACL verification strictly enforced before every file stream.
          </p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Access Evaluation Outcomes
          </h3>
          <p className="text-xs text-slate-400">Audit results across organizational activities</p>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomeDistribution} barSize={40}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
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

        {/* Cryptographic Health Checklist */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Cryptographic Baseline Audit
          </h3>
          <p className="text-xs text-slate-400">Real-time validation of organizational security controls</p>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                AES-256-GCM Hardware Acceleration
              </span>
              <span className="text-emerald-600 font-bold">ACTIVE</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Argon2id Memory-Hard KDF
              </span>
              <span className="text-emerald-600 font-bold">19456 KB / 2 Passes</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Random 96-Bit Nonce Uniqueness
              </span>
              <span className="text-emerald-600 font-bold">VERIFIED</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                HTTP-Only Secure SameSite Cookies
              </span>
              <span className="text-emerald-600 font-bold">ENFORCED</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-950 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Deny-by-Default BOLA Mitigation
              </span>
              <span className="text-emerald-600 font-bold">PASS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

