import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Terminal,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLogItem } from '../types';
import { Badge } from '../components/common/Badge';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded row ID for JSON metadata inspection
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, [page, actionFilter, resultFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuditLogs({
        page,
        limit: 15,
        action: actionFilter || undefined,
        result: resultFilter || undefined,
      });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve audit trail.');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Security Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tamper-evident system logs tracking authentication, cryptographic operations, and access decisions.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Immutable Ledger Active</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by action (e.g. FILE_DOWNLOAD)..."
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
          />
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500">Result:</span>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-royal/40"
          >
            <option value="">All Results</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
            <option value="DENIED">DENIED (Unauthorized)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Target Resource</th>
                <th className="py-3.5 px-4">Outcome</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() => toggleExpand(log.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 sm:px-6 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        {log.actor ? (
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                              {log.actor.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.actor.email} &bull; [{log.actor.role}]
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Anonymous / System</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-royal dark:text-royal-300">
                        {log.action}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {log.file ? (
                          <span className="font-medium truncate max-w-xs block">
                            {log.file.originalName}
                          </span>
                        ) : log.targetUserId ? (
                          <span className="text-slate-400 font-mono text-[11px]">
                            User ID: {log.targetUserId.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-slate-400">&mdash;</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            log.result === 'SUCCESS'
                              ? 'success'
                              : log.result === 'DENIED'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {log.result}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1 rounded text-slate-400 hover:text-royal">
                          {expandedLogId === log.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable JSON Metadata Inspector */}
                    {expandedLogId === log.id && (
                      <tr className="bg-slate-50 dark:bg-navy-950/80">
                        <td colSpan={6} className="p-4 sm:px-6">
                          <div className="p-3.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                              <Terminal className="w-4 h-4 text-royal" />
                              <span>Audit Metadata & IP Attribution</span>
                            </div>
                            <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-navy-950 p-3 rounded-lg overflow-x-auto">
                              {JSON.stringify(
                                {
                                  auditId: log.id,
                                  action: log.action,
                                  ipAddress: log.ipAddress || '127.0.0.1 (Localhost)',
                                  userAgent: log.userAgent || 'Web Client',
                                  metadata: log.metadata || {},
                                },
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing page {page} of {totalPages} ({total} audit events total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 disabled:opacity-50 text-slate-700 dark:text-slate-300"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

