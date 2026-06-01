import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Shield, DollarSign, TrendingUp, AlertTriangle, Clock,
  Activity, Plus, Key, BarChart3, ArrowRight, Eye, Lock,
  CheckCircle2, XCircle, Wallet, Zap,
  ShieldCheck,
} from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { ExpenseTrendChart } from '../components/charts/ExpenseTrendChart';
import { dashboardService } from '../services/dashboard.service';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatRelativeTime } from '../utils/format';
import type { DashboardStats, ExpenseTrend } from '../types';
import { cn } from '../utils/cn';

const LOG_LABELS: Record<string, string> = {
  LOGIN: 'Signed in', LOGOUT: 'Signed out', FAILED_LOGIN: 'Failed login',
  VAULT_CREATE: 'Added vault entry', VAULT_UPDATE: 'Updated vault entry',
  VAULT_DELETE: 'Deleted vault entry', PASSWORD_VIEW: 'Viewed password',
  PASSWORD_COPY: 'Copied password', EXPENSE_CREATE: 'Added expense',
  EXPENSE_UPDATE: 'Updated expense', EXPENSE_DELETE: 'Deleted expense',
  USER_CREATE: 'Created user', USER_UPDATE: 'Updated user',
  MASTER_PASSWORD_VERIFY: 'Verified master password',
};

const LOG_ICONS: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  LOGIN:       { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  LOGOUT:      { icon: Activity,     color: 'text-slate-500',   bg: 'bg-slate-50'   },
  FAILED_LOGIN:{ icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50'     },
  VAULT_CREATE:{ icon: Shield,       color: 'text-blue-600',    bg: 'bg-blue-50'    },
  PASSWORD_VIEW:{ icon: Eye,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
  PASSWORD_COPY:{ icon: Eye,         color: 'text-amber-600',   bg: 'bg-amber-50'   },
  EXPENSE_CREATE:{ icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

/* ── Security Score ────────────────────────────────────────────────────────── */
function SecurityScore({ stats }: { stats: DashboardStats }) {
  const total = stats.vault.total;
  const weak = stats.vault.weakPasswords;
  const strong = total > 0 ? total - weak : 0;
  const score = total === 0 ? 100 : Math.round((strong / total) * 100);

  const scoreColor =
    score >= 80 ? 'text-emerald-600' :
    score >= 60 ? 'text-amber-600' :
    'text-red-600';

  const scoreBg =
    score >= 80 ? 'from-emerald-500 to-emerald-600' :
    score >= 60 ? 'from-amber-400 to-amber-500' :
    'from-red-500 to-red-600';

  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';

  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      {/* Circular gauge */}
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="38" fill="none" stroke="#F1F5F9" strokeWidth="7" />
          <circle
            cx="44" cy="44" r="38" fill="none"
            stroke={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-lg font-bold', scoreColor)}>{score}</span>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className={scoreColor} />
          <span className={cn('text-sm font-semibold', scoreColor)}>{label}</span>
        </div>
        <p className="text-xs text-slate-500">Security Score</p>
        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            {strong} strong passwords
          </div>
          {weak > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {weak} weak passwords
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<ExpenseTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getExpenseTrend(6),
    ]).then(([s, t]) => {
      if (s.data) setStats(s.data);
      if (t.data) setTrend(t.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader text="Loading dashboard..." />;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const monthChange = stats?.expenses.monthOverMonthChange ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="relative overflow-hidden rounded-2xl text-white"
        style={{
          background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 35%, #4f46e5 70%, #4338ca 100%)',
          boxShadow: '0 8px 32px rgba(37,99,235,0.4), 0 2px 8px rgba(37,99,235,0.2)',
        }}
      >
        {/* Layered depth backgrounds */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-8 w-48 h-48 bg-blue-300/15 rounded-full blur-3xl pointer-events-none" />
        {/* Shimmer line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-blue-200/80 text-xs font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              {greeting}, {user?.firstName}!
            </h1>
            <p className="text-blue-200/70 text-sm mt-2 max-w-md leading-relaxed">
              Your vault has <strong className="text-white font-bold">{stats?.vault.total ?? 0}</strong> entries secured.
              Monthly spending is <strong className="text-white font-bold">{formatCurrency(stats?.expenses.currentMonth ?? 0)}</strong>.
            </p>
          </div>
          <div className="flex gap-2.5 flex-wrap">
            <Link to="/vault/new">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-semibold transition-all backdrop-blur-sm hover:scale-[1.03] active:scale-[0.98] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                <Lock size={14} /> Add Password
              </button>
            </Link>
            <Link to="/expenses/new">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-semibold transition-all backdrop-blur-sm hover:scale-[1.03] active:scale-[0.98] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
                <DollarSign size={14} /> Add Expense
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Stats Grid ──────────────────────────────────────────────────────── */}
      <div className={cn(
        'grid gap-4',
        isAdmin ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3',
      )}>
        {isAdmin && (
          <StatCard
            title="Total Users"
            value={stats?.users.total ?? 0}
            subtitle={`${stats?.users.active ?? 0} active`}
            icon={Users}
            gradient="stat-indigo"
            index={0}
          />
        )}
        <StatCard
          title="Vault Entries"
          value={stats?.vault.total ?? 0}
          subtitle={
            stats?.vault.weakPasswords
              ? `${stats.vault.weakPasswords} weak passwords`
              : 'All passwords strong'
          }
          icon={Shield}
          gradient="stat-blue"
          index={isAdmin ? 1 : 0}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats?.expenses.currentMonth ?? 0)}
          trend={monthChange || undefined}
          trendLabel="vs last month"
          icon={Wallet}
          gradient="stat-emerald"
          index={isAdmin ? 2 : 1}
        />
        <StatCard
          title="Year to Date"
          value={formatCurrency(stats?.expenses.yearToDate ?? 0)}
          subtitle={`${stats?.expenses.total ?? 0} transactions`}
          icon={TrendingUp}
          gradient="stat-violet"
          index={isAdmin ? 3 : 2}
        />
      </div>

      {/* ── Security Alerts ─────────────────────────────────────────────────── */}
      {((stats?.vault.weakPasswords ?? 0) > 0 || (stats?.vault.expiringSoon ?? 0) > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(stats?.vault.weakPasswords ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"
            >
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  {stats?.vault.weakPasswords} weak password{(stats?.vault.weakPasswords ?? 0) > 1 ? 's' : ''} detected
                </p>
                <p className="text-xs text-red-600/80 mt-0.5">Review and strengthen these entries</p>
              </div>
              <Link to="/vault">
                <button className="flex-shrink-0 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
                  Review
                </button>
              </Link>
            </motion.div>
          )}
          {(stats?.vault.expiringSoon ?? 0) > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {stats?.vault.expiringSoon} password{(stats?.vault.expiringSoon ?? 0) > 1 ? 's' : ''} expiring soon
                </p>
                <p className="text-xs text-amber-600/80 mt-0.5">Within the next 30 days</p>
              </div>
              <Link to="/vault">
                <button className="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
                  Update
                </button>
              </Link>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Main Content Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Expense Trend Chart — spans 2 cols */}
        <div className="xl:col-span-2">
          <Card padding="none" className="h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp size={15} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Expense Trend</h2>
                  <p className="text-xs text-slate-500">Last 6 months overview</p>
                </div>
              </div>
              <Link to="/expenses">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors">
                  View all <ArrowRight size={12} />
                </button>
              </Link>
            </div>
            <div className="p-5">
              <ExpenseTrendChart data={trend} height={240} showAverage />
            </div>
          </Card>
        </div>

        {/* Right column: Security Score + Recent Activity */}
        <div className="flex flex-col gap-6">
          {/* Security Score card */}
          {stats && (
            <Card className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShieldCheck size={15} className="text-blue-600" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">Security Score</h2>
              </div>
              <SecurityScore stats={stats} />
            </Card>
          )}

          {/* Recent Activity */}
          <Card padding="none" className="flex-1 min-h-0">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">Recent Activity</h2>
              </div>
              <Link to="/activity-logs">
                <button className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">See all</button>
              </Link>
            </div>
            <div className="divide-y divide-slate-50 overflow-y-auto max-h-64">
              {stats?.recentActivity.slice(0, 8).map((log) => {
                const cfg = LOG_ICONS[log.action] ?? { icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50' };
                const IconCmp = cfg.icon;
                return (
                  <div key={log.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60 transition-colors">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                      <IconCmp size={13} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {LOG_LABELS[log.action] ?? log.action}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                    </div>
                    {!log.success && <Badge variant="destructive" size="xs">Failed</Badge>}
                  </div>
                );
              })}
              {(!stats?.recentActivity.length) && (
                <p className="px-4 py-8 text-center text-xs text-slate-400">No activity yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Password',  href: '/vault/new',           icon: Lock,     gradient: 'from-blue-500 to-blue-600',     glow: 'rgba(37,99,235,0.25)',    desc: 'Store credentials securely'  },
            { label: 'Generator',     href: '/password-generator',  icon: Key,      gradient: 'from-indigo-500 to-indigo-600', glow: 'rgba(99,102,241,0.25)',   desc: 'Create strong password'      },
            { label: 'Add Expense',   href: '/expenses/new',        icon: DollarSign, gradient: 'from-emerald-500 to-emerald-600', glow: 'rgba(16,185,129,0.25)', desc: 'Track your spending'       },
            { label: 'View Reports',  href: '/reports',             icon: BarChart3, gradient: 'from-violet-500 to-violet-600',  glow: 'rgba(124,58,237,0.25)',   desc: 'Financial analytics'        },
          ].map((action, i) => (
            <Link key={action.href} to={action.href}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07, duration: 0.35 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 cursor-pointer group transition-all relative overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${action.glow}, 0 2px 8px rgba(0,0,0,0.06)`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04)'; }}
              >
                {/* Top shimmer */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
                <div className={cn('w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.12)]', action.gradient)}>
                  <action.icon size={18} className="text-white" />
                </div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{action.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{action.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom grid: Expense summary + Vault health ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Month vs last month */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Wallet size={15} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Spending Comparison</h2>
              <p className="text-xs text-slate-500">This month vs last month</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-slate-500 font-medium">This Month</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(stats?.expenses.currentMonth ?? 0)}</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((stats?.expenses.currentMonth ?? 0) / Math.max(stats?.expenses.lastMonth ?? 1, stats?.expenses.currentMonth ?? 1, 1)) * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-slate-500 font-medium">Last Month</p>
                <p className="text-sm font-bold text-slate-900">{formatCurrency(stats?.expenses.lastMonth ?? 0)}</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((stats?.expenses.lastMonth ?? 0) / Math.max(stats?.expenses.lastMonth ?? 1, stats?.expenses.currentMonth ?? 1, 1)) * 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-slate-300 to-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Year to date total</p>
              <p className="text-base font-bold text-slate-900">{formatCurrency(stats?.expenses.yearToDate ?? 0)}</p>
            </div>
          </div>
        </Card>

        {/* Password vault health */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Shield size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Vault Health</h2>
              <p className="text-xs text-slate-500">Password security overview</p>
            </div>
          </div>

          {stats?.vault.total === 0 ? (
            <div className="text-center py-6">
              <Shield size={32} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No vault entries yet</p>
              <Link to="/vault/new">
                <Button size="sm" variant="primary" className="mt-3" leftIcon={Plus}>Add First Entry</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                {
                  label: 'Strong passwords',
                  value: (stats?.vault.total ?? 0) - (stats?.vault.weakPasswords ?? 0),
                  total: stats?.vault.total ?? 1,
                  color: 'bg-emerald-500',
                  textColor: 'text-emerald-600',
                },
                {
                  label: 'Weak passwords',
                  value: stats?.vault.weakPasswords ?? 0,
                  total: stats?.vault.total ?? 1,
                  color: 'bg-red-500',
                  textColor: 'text-red-600',
                },
                {
                  label: 'Expiring soon',
                  value: stats?.vault.expiringSoon ?? 0,
                  total: stats?.vault.total ?? 1,
                  color: 'bg-amber-500',
                  textColor: 'text-amber-600',
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs text-slate-600 font-medium">{item.label}</p>
                    <p className={cn('text-xs font-bold', item.textColor)}>{item.value}</p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (item.value / item.total) * 100)}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.5 }}
                      className={cn('h-full rounded-full', item.color)}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Total entries</p>
                <p className="text-sm font-bold text-slate-900">{stats?.vault.total}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
