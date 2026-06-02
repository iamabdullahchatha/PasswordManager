import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, CheckCircle2, XCircle, Clock, Shield,
  LogIn, LogOut, Eye, DollarSign, Users, Key, Download,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { api } from '../services/api';
import { formatDate, formatRelativeTime } from '../utils/format';
import { cn } from '../utils/cn';
import type { ActivityLog } from '../types';

const ACTION_COLORS: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  LOGIN: 'success',    LOGOUT: 'secondary',       FAILED_LOGIN: 'destructive',
  PASSWORD_VIEW: 'warning', PASSWORD_COPY: 'warning',
  VAULT_CREATE: 'success',  VAULT_DELETE: 'destructive',
  EXPENSE_CREATE: 'success', EXPENSE_DELETE: 'destructive',
  USER_CREATE: 'success',   USER_DELETE: 'destructive',
  MASTER_PASSWORD_VERIFY: 'warning',
};

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Signed In',                  LOGOUT: 'Signed Out',
  FAILED_LOGIN: 'Failed Login',         TOKEN_REFRESH: 'Session Refreshed',
  PASSWORD_VIEW: 'Viewed Password',     PASSWORD_COPY: 'Copied Password',
  VAULT_CREATE: 'Created Vault Entry',  VAULT_UPDATE: 'Updated Vault Entry',
  VAULT_DELETE: 'Deleted Vault Entry',  EXPENSE_CREATE: 'Added Expense',
  EXPENSE_UPDATE: 'Updated Expense',    EXPENSE_DELETE: 'Deleted Expense',
  USER_CREATE: 'Created User',          USER_UPDATE: 'Updated User',
  USER_DELETE: 'Deleted User',          USER_TOGGLE_STATUS: 'Changed User Status',
  MASTER_PASSWORD_SET: 'Set Master Password',
  MASTER_PASSWORD_VERIFY: 'Verified Master Password',
  EXPORT_DATA: 'Exported Data',         REPORT_GENERATE: 'Generated Report',
  PASSWORD_RESET_REQUEST: 'Requested Password Reset',
  PASSWORD_RESET_COMPLETE: 'Reset Password',
};

const ACTION_ICONS: Record<string, React.ComponentType<any>> = {
  LOGIN: LogIn,     LOGOUT: LogOut,      FAILED_LOGIN: XCircle,
  PASSWORD_VIEW: Eye, PASSWORD_COPY: Eye,
  VAULT_CREATE: Shield, VAULT_DELETE: Shield,
  EXPENSE_CREATE: DollarSign, EXPENSE_DELETE: DollarSign,
  USER_CREATE: Users, USER_DELETE: Users,
  MASTER_PASSWORD_VERIFY: Key, MASTER_PASSWORD_SET: Key,
  EXPORT_DATA: Download,
};

const FILTER_OPTIONS = [
  { label: 'All Events',  value: null },
  { label: 'Successful',  value: true },
  { label: 'Failed',      value: false },
];

export default function ActivityLogsPage() {
  const [logs, setLogs]           = useState<ActivityLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filterSuccess, setFilterSuccess] = useState<boolean | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '30' };
      if (filterSuccess !== null) params.success = String(filterSuccess);
      // NOTE: api already has baseURL='/api/v1' — use the path WITHOUT that prefix
      const res = await api.get('/logs', { params });
      setLogs(res.data.data ?? []);
      setTotalPages(res.data.meta?.totalPages ?? 1);
      setTotalLogs(res.data.meta?.total ?? 0);
    } catch {
      // Show empty state on error rather than crashing
      setLogs([]);
    } finally { setLoading(false); }
  }, [page, filterSuccess]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Activity Logs"
        description="Security audit trail of all account actions"
        icon={Activity}
        badge={
          <Badge variant="secondary" size="sm">{totalLogs.toLocaleString()} events</Badge>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={String(f.label)}
            onClick={() => { setFilterSuccess(f.value); setPage(1); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
              filterSuccess === f.value
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            )}
          >
            {f.value === true  && <CheckCircle2 size={13} />}
            {f.value === false && <XCircle size={13} />}
            {f.value === null  && <Activity size={13} />}
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <PageLoader /> : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity logs"
          description="Security actions will appear here as you use the app"
        />
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {['Status', 'Action', 'User', 'IP Address', 'Time'].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log, i) => {
                    const IconCmp = ACTION_ICONS[log.action] ?? Activity;
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center',
                            log.success ? 'bg-emerald-50' : 'bg-red-50',
                          )}>
                            {log.success
                              ? <CheckCircle2 size={14} className="text-emerald-600" />
                              : <XCircle size={14} className="text-red-600" />}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                              log.success ? 'bg-slate-100' : 'bg-red-50',
                            )}>
                              <IconCmp size={13} className={log.success ? 'text-slate-500' : 'text-red-500'} />
                            </div>
                            <div>
                              <Badge variant={ACTION_COLORS[log.action] ?? 'secondary'} size="sm">
                                {ACTION_LABELS[log.action] ?? log.action}
                              </Badge>
                              {log.resource && (
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {log.resource}
                                  {log.resourceId ? ` · ${log.resourceId.slice(0, 8)}…` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-slate-900">
                            {log.user?.firstName} {log.user?.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{log.user?.email}</p>
                        </td>

                        {/* IP */}
                        <td className="px-5 py-3.5">
                          <code className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                            {log.ipAddress ?? '—'}
                          </code>
                        </td>

                        {/* Time */}
                        <td className="px-5 py-3.5">
                          <p className="text-sm text-slate-700 font-medium">{formatRelativeTime(log.createdAt)}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock size={10} />
                            {formatDate(log.createdAt, { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Previous
              </Button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                        page === p
                          ? 'bg-blue-600 text-white shadow-blue-sm'
                          : 'text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > 7 && <span className="text-slate-400">…</span>}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
