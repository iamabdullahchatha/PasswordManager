import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, Calendar, Receipt, PieChart as PieIcon,
  Search, Filter, X, Download, Edit, Trash2, CreditCard, ArrowUpDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { PaymentMethodDonutChart } from '../../components/charts/PaymentMethodDonutChart';
import { DailyTrendChart } from '../../components/charts/DailyTrendChart';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../../components/ui/Modal';
import { expensesService } from '../../services/expenses.service';
import {
  formatCurrency, formatDate,
  EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS,
  PAYMENT_METHOD_LABELS, PAYMENT_METHOD_COLORS,
  EXPENSE_STATUS_LABELS, EXPENSE_STATUS_COLORS,
  MONTH_NAMES,
} from '../../utils/format';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { cn } from '../../utils/cn';
import type { Expense, ExpenseCategory, PaymentMethod, ExpenseStatus } from '../../types';

const selectCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

function downloadCsv(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function MonthlyExpensesPage() {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search,        setSearch]        = useState('');
  const [filterCat,     setFilterCat]     = useState('');
  const [filterMethod,  setFilterMethod]  = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [showFilters,   setShowFilters]   = useState(false);
  const [sortBy,        setSortBy]        = useState<'date' | 'amount'>('date');
  const [sortOrder,     setSortOrder]     = useState<'asc' | 'desc'>('desc');

  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expensesService.getMonthly(year, month);
      setData(res.data);
    } finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await expensesService.delete(deleteTarget.id);
      setData((prev: any) => ({ ...prev, expenses: prev.expenses.filter((e: Expense) => e.id !== deleteTarget.id) }));
      setDeleteTarget(null);
      toast('Expense deleted', 'success');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await expensesService.exportCsv({ year: String(year), month: String(month) });
      downloadCsv(blob, `expenses-${year}-${String(month).padStart(2, '0')}.csv`);
      toast('Exported successfully', 'success');
    } catch { toast('Export failed', 'error'); } finally { setExporting(false); }
  };

  const isCurrent  = year === now.getFullYear() && month === now.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Filter + sort expenses
  const filteredExpenses = (data?.expenses ?? []).filter((e: Expense) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) &&
        !(e.vendor ?? '').toLowerCase().includes(search.toLowerCase()) &&
        !(e.description ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat    && e.category      !== filterCat)    return false;
    if (filterMethod && e.paymentMethod !== filterMethod) return false;
    if (filterStatus && e.status        !== filterStatus) return false;
    return true;
  }).sort((a: Expense, b: Expense) => {
    const va = sortBy === 'date' ? new Date(a.date).getTime() : Number(a.amount);
    const vb = sortBy === 'date' ? new Date(b.date).getTime() : Number(b.amount);
    return sortOrder === 'asc' ? va - vb : vb - va;
  });

  const hasFilters = search || filterCat || filterMethod || filterStatus;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monthly Expenses"
        description="Detailed spending breakdown by month"
        icon={Calendar}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={Download} onClick={handleExport} loading={exporting}>CSV</Button>
            <Button
              variant="outline" size="sm"
              leftIcon={Filter}
              onClick={() => setShowFilters((s) => !s)}
              className={showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
            >
              Filters {hasFilters && <span className="ml-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center">{[search, filterCat, filterMethod, filterStatus].filter(Boolean).length}</span>}
            </Button>
            <Link to="/expenses/new">
              <Button variant="primary" size="sm" leftIcon={Plus}>Add</Button>
            </Link>
          </div>
        }
      />

      {/* ── Month Navigator ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 flex items-center gap-4">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-lg font-extrabold text-slate-900">{MONTH_NAMES[month - 1]}</p>
          <p className="text-xs text-slate-500">{year}</p>
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrent}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Search expenses…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className={selectCls} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                <option value="">All Categories</option>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select className={selectCls} value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)}>
                <option value="">All Payment Methods</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <select className={selectCls} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {['PAID', 'PENDING', 'CANCELLED'].map((s) => (
                  <option key={s} value={s}>{EXPENSE_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <button
                className="mt-3 text-xs text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
                onClick={() => { setSearch(''); setFilterCat(''); setFilterMethod(''); setFilterStatus(''); }}
              >
                <X size={12} /> Clear filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <PageLoader /> : data && (
        <>
          {/* ── Summary Cards ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Spent',   value: formatCurrency(data.total),          color: 'from-blue-500 to-blue-600',     bg: 'bg-blue-50'    },
              { label: 'Paid',          value: formatCurrency(data.paid ?? 0),       color: 'from-green-500 to-green-600',   bg: 'bg-green-50'   },
              { label: 'Pending',       value: formatCurrency(data.pending ?? 0),    color: 'from-amber-500 to-amber-600',   bg: 'bg-amber-50'   },
              { label: 'Daily Average', value: formatCurrency(data.dailyAvg ?? 0),   color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50'  },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card"
              >
                <p className="text-xs font-medium text-slate-500 mb-2">{s.label}</p>
                <p className="text-lg font-extrabold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{filteredExpenses.length} transactions</p>
              </motion.div>
            ))}
          </div>

          {/* ── Highest / Lowest ───────────────────────────────────────── */}
          {(data.highest || data.lowest) && (
            <div className="grid grid-cols-2 gap-4">
              {data.highest && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-red-700 mb-1">Highest Expense</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{data.highest.title}</p>
                  <p className="text-lg font-extrabold text-red-600">{formatCurrency(Number(data.highest.amount))}</p>
                </div>
              )}
              {data.lowest && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-green-700 mb-1">Lowest Expense</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{data.lowest.title}</p>
                  <p className="text-lg font-extrabold text-green-600">{formatCurrency(Number(data.lowest.amount))}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Charts ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Daily trend */}
            {data.byDay && Object.keys(data.byDay).length > 0 && (
              <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">Daily Spending Trend</h3>
                  <p className="text-xs text-slate-500">{MONTH_NAMES[month - 1]} {year}</p>
                </div>
                <div className="p-5">
                  <DailyTrendChart data={data.byDay} daysInMonth={daysInMonth} />
                </div>
              </div>
            )}

            {/* Payment method */}
            {data.byPaymentMethod && Object.keys(data.byPaymentMethod).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CreditCard size={14} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">By Payment Method</p>
                </div>
                <div className="p-5">
                  <PaymentMethodDonutChart data={data.byPaymentMethod} />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Category pie */}
            {data.byCategory && Object.keys(data.byCategory).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <PieIcon size={14} className="text-violet-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">By Category</p>
                </div>
                <div className="p-5">
                  <CategoryPieChart data={data.byCategory} height={240} />
                </div>
              </div>
            )}

            {/* Category bars */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">Category Summary</p>
              </div>
              <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(data.byCategory ?? {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([cat, amount]) => {
                    const pct = data.total > 0 ? ((amount as number) / data.total) * 100 : 0;
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-900 truncate flex-1">{EXPENSE_CATEGORY_LABELS[cat] ?? cat}</span>
                          <span className="text-slate-600 font-semibold ml-2">{formatCurrency(amount as number)}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[cat] ?? '#6b7280' }}
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{pct.toFixed(1)}%</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ── Transactions ───────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Receipt size={14} className="text-slate-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Transactions <span className="text-slate-400 font-normal">({filteredExpenses.length})</span>
                </h3>
              </div>
              <button
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                onClick={() => {
                  if (sortBy === 'date') { setSortBy('amount'); }
                  else { setSortBy('date'); setSortOrder((o) => o === 'asc' ? 'desc' : 'asc'); }
                }}
              >
                <ArrowUpDown size={13} />
                Sort by {sortBy === 'date' ? 'amount' : 'date'} ({sortOrder})
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-500">{hasFilters ? 'No expenses match your filters' : 'No expenses this month'}</p>
                  {!hasFilters && (
                    <Link to="/expenses/new">
                      <Button size="sm" variant="outline" className="mt-3" leftIcon={Plus}>Add Expense</Button>
                    </Link>
                  )}
                </div>
              ) : (
                filteredExpenses.map((expense: Expense, i: number) => (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.3) }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${EXPENSE_CATEGORY_COLORS[expense.category] ?? '#6B7280'}18` }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[expense.category] ?? '#6B7280' }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{expense.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-400">{formatDate(expense.date)}</span>
                        <Badge variant="secondary" size="xs">{EXPENSE_CATEGORY_LABELS[expense.category] ?? expense.category}</Badge>
                        {expense.vendor && <span className="text-xs text-slate-400 truncate max-w-[100px]">{expense.vendor}</span>}
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${EXPENSE_STATUS_COLORS[expense.status]}18`,
                            color: EXPENSE_STATUS_COLORS[expense.status],
                          }}
                        >
                          {EXPENSE_STATUS_LABELS[expense.status] ?? expense.status}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${PAYMENT_METHOD_COLORS[expense.paymentMethod] ?? '#6b7280'}18`,
                            color: PAYMENT_METHOD_COLORS[expense.paymentMethod] ?? '#6b7280',
                          }}
                        >
                          {PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod}
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
                ))
              )}
            </div>
          </div>
        </>
      )}

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
    </div>
  );
}
