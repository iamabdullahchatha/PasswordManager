import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, Trash2, Edit,
  ArrowRight, Receipt, PieChart, Wallet, RefreshCw, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Download, Target,
} from 'lucide-react';
import { ReportExportModal } from '../../components/ui/ReportExportModal';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/Modal';
import { CurrencySelector } from '../../components/ui/CurrencySelector';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { expensesService } from '../../services/expenses.service';
import {
  formatCurrency, formatDate,
  EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS,
  PAYMENT_METHOD_LABELS, EXPENSE_STATUS_LABELS, EXPENSE_STATUS_COLORS,
} from '../../utils/format';
import { useCurrencyStore } from '../../store/currencyStore';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { cn } from '../../utils/cn';
import type { Expense, Budget } from '../../types';

export default function ExpenseDashboardPage() {
  const { currency } = useCurrencyStore();
  const fmt = (amount: number) => formatCurrency(amount, currency);

  const [summary, setSummary]   = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets]   = useState<Budget[]>([]);
  const [loading, setLoading]   = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const now = new Date();

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, listRes, budgetRes] = await Promise.all([
        expensesService.getSummary(),
        expensesService.list({ limit: '10', sortBy: 'date', sortOrder: 'desc' }),
        expensesService.getBudgets(now.getMonth() + 1, now.getFullYear()),
      ]);
      setSummary(summaryRes.data);
      setExpenses(listRes.data ?? []);
      setBudgets(budgetRes.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await expensesService.delete(deleteTarget.id);
      setExpenses((p) => p.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('Expense deleted', 'success');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  if (loading) return <PageLoader />;

  const monthlyTotal   = summary?.monthly?.total   ?? 0;
  const yearlyTotal    = summary?.yearly?.total    ?? 0;
  const prevMonthTotal = summary?.prevMonth?.total ?? 0;
  const growthPct      = summary?.growthPct        ?? 0;
  const dailyAvg       = summary?.dailyAvg         ?? 0;
  const pendingTotal   = summary?.pending?.total   ?? 0;
  const pendingCount   = summary?.pending?.count   ?? 0;
  const recurringCount = summary?.recurringCount   ?? 0;
  const overallBudget  = budgets.find((b) => b.category === null);
  const remaining      = overallBudget ? Number(overallBudget.amount) - monthlyTotal : null;
  const topCat         = summary?.topCategoryThisMonth;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Tracker"
        description="Monitor and analyze your spending patterns"
        icon={Wallet}
        action={
          <div className="flex flex-wrap gap-2">
            <CurrencySelector />
            <Button variant="outline" size="sm" leftIcon={Download} onClick={() => setExportModalOpen(true)}>
              Download Report
            </Button>
            <Link to="/expenses/monthly">
              <Button variant="outline" size="sm" leftIcon={Calendar}>Monthly</Button>
            </Link>
            <Link to="/expenses/new">
              <Button variant="primary" size="sm" leftIcon={Plus}>Add Expense</Button>
            </Link>
          </div>
        }
      />

      {/* ── 8 Dashboard Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="This Month"
          value={fmt(monthlyTotal)}
          subtitle={`${summary?.monthly?.count ?? 0} transactions`}
          icon={DollarSign}
          gradient="stat-emerald"
          index={0}
        />
        <StatCard
          title="Year to Date"
          value={fmt(yearlyTotal)}
          subtitle={`${summary?.yearly?.count ?? 0} transactions`}
          icon={TrendingUp}
          gradient="stat-blue"
          index={1}
        />
        <StatCard
          title="Daily Average"
          value={fmt(dailyAvg)}
          subtitle="This month so far"
          icon={BarChart3}
          gradient="stat-violet"
          index={2}
        />
        <StatCard
          title="Month Growth"
          value={`${growthPct > 0 ? '+' : ''}${growthPct.toFixed(1)}%`}
          subtitle={`vs last month (${fmt(prevMonthTotal)})`}
          icon={growthPct >= 0 ? ArrowUpRight : ArrowDownRight}
          gradient={growthPct >= 0 ? 'stat-rose' : 'stat-emerald'}
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Remaining budget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            'bg-white rounded-2xl border p-5 shadow-card',
            remaining !== null && remaining < 0 ? 'border-red-200 bg-red-50/40' : 'border-slate-200',
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Budget Left</p>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', remaining !== null && remaining < 0 ? 'bg-red-100' : 'bg-green-50')}>
              <Target size={14} className={remaining !== null && remaining < 0 ? 'text-red-600' : 'text-green-600'} />
            </div>
          </div>
          <p className={cn('text-xl font-extrabold', remaining !== null && remaining < 0 ? 'text-red-600' : 'text-slate-900')}>
            {remaining !== null ? fmt(remaining) : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {remaining === null ? 'No budget set' : remaining < 0 ? 'Over budget!' : 'Remaining this month'}
          </p>
        </motion.div>

        {/* Top category */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top Category</p>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <PieChart size={14} className="text-orange-600" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900 truncate">
            {topCat ? EXPENSE_CATEGORY_LABELS[topCat] ?? topCat : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Highest spending this month</p>
        </motion.div>

        {/* Pending */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={cn('bg-white rounded-2xl border p-5 shadow-card', pendingCount > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200')}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending</p>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', pendingCount > 0 ? 'bg-amber-100' : 'bg-slate-50')}>
              <Clock size={14} className={pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{fmt(pendingTotal)}</p>
          <p className="text-xs text-slate-500 mt-1">{pendingCount} unpaid expense{pendingCount !== 1 ? 's' : ''}</p>
        </motion.div>

        {/* Recurring */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recurring</p>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <RefreshCw size={14} className="text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-extrabold text-slate-900">{recurringCount}</p>
          <p className="text-xs text-slate-500 mt-1">Scheduled recurring expenses</p>
        </motion.div>
      </div>

      {/* ── Budget Alerts ─────────────────────────────────────────────────── */}
      {budgets.filter((b) => b.usedPct !== undefined && b.usedPct >= 80).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Budget Warning</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {budgets.filter((b) => b.usedPct !== undefined && b.usedPct >= 80).map((b) =>
                b.category
                  ? `${EXPENSE_CATEGORY_LABELS[b.category] ?? b.category} (${(b.usedPct ?? 0).toFixed(0)}% used)`
                  : `Overall budget (${(b.usedPct ?? 0).toFixed(0)}% used)`,
              ).join(', ')} {budgets.filter((b) => b.usedPct !== undefined && b.usedPct >= 80).length > 1 ? 'are' : 'is'} near or over limit.
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation + Category Chart ───────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          {[
            { to: '/expenses/monthly',  label: 'Monthly Report',   sub: 'Detailed breakdown by month',   icon: Calendar, color: 'from-blue-500 to-blue-600',   hover: 'group-hover:text-blue-600' },
            { to: '/expenses/yearly',   label: 'Yearly Analysis',  sub: 'Annual spending overview',       icon: BarChart3, color: 'from-violet-500 to-violet-600', hover: 'group-hover:text-violet-600' },
            { to: '/reports',           label: 'Full Reports',     sub: 'Charts, budgets & analytics',    icon: PieChart,  color: 'from-emerald-500 to-emerald-600', hover: 'group-hover:text-emerald-600' },
            { to: '/expenses/budgets',  label: 'Manage Budgets',   sub: 'Set spending limits',            icon: Target,    color: 'from-orange-500 to-orange-600', hover: 'group-hover:text-orange-600' },
          ].map((nav) => (
            <Link key={nav.to} to={nav.to}>
              <motion.div
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card hover:shadow-card-hover transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm', nav.color)}>
                    <nav.icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold text-slate-900 transition-colors', nav.hover)}>{nav.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{nav.sub}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Category chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <PieChart size={15} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Spending by Category</h3>
              <p className="text-xs text-slate-500">This month's distribution</p>
            </div>
          </div>
          <div className="p-5">
            {summary?.monthly?.byCategory && Object.keys(summary.monthly.byCategory).length > 0 ? (
              <CategoryPieChart data={summary.monthly.byCategory} height={260} />
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <PieChart size={32} className="text-slate-200 mb-3" />
                <p className="text-sm text-slate-500">No spending data for this month</p>
                <Link to="/expenses/new">
                  <Button size="sm" variant="outline" className="mt-3" leftIcon={Plus}>Add Expense</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Expenses ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Receipt size={15} className="text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Expenses</h2>
          </div>
          <Link to="/expenses/monthly">
            <Button variant="ghost" size="sm">View all <ArrowRight size={12} className="ml-1" /></Button>
          </Link>
        </div>

        {expenses.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No expenses yet"
            description="Start tracking your spending"
            action={
              <Link to="/expenses/new">
                <Button variant="primary" leftIcon={Plus}>Add First Expense</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {expenses.map((expense, i) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${EXPENSE_CATEGORY_COLORS[expense.category] ?? '#6B7280'}18` }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[expense.category] ?? '#6B7280' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{expense.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant="secondary" size="xs">{EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}</Badge>
                    <span className="text-xs text-slate-400">{formatDate(expense.date)}</span>
                    {expense.vendor && <span className="text-xs text-slate-400 truncate max-w-[120px]">{expense.vendor}</span>}
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${EXPENSE_STATUS_COLORS[expense.status] ?? '#6B7280'}18`,
                        color: EXPENSE_STATUS_COLORS[expense.status] ?? '#6B7280',
                      }}
                    >
                      {EXPENSE_STATUS_LABELS[expense.status] ?? expense.status}
                    </span>
                    {expense.isRecurring && <Badge variant="blue" size="xs">Recurring</Badge>}
                  </div>
                </div>

                <p className="text-sm font-bold text-slate-900 flex-shrink-0 tabular-nums">
                  {formatCurrency(Number(expense.amount), expense.currency)}
                </p>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Link to={`/expenses/${expense.id}/edit`}>
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                      <Edit size={13} />
                    </button>
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(expense)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        description={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        icon={Trash2}
      />

      <ReportExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        currency={currency}
        period={{ year: now.getFullYear(), month: now.getMonth() + 1 }}
      />
    </div>
  );
}
