import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Plus, Trash2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Save,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { ConfirmDialog } from '../../components/ui/Modal';
import { BudgetVsActualChart } from '../../components/charts/BudgetVsActualChart';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { expensesService } from '../../services/expenses.service';
import { formatCurrency, EXPENSE_CATEGORY_LABELS, MONTH_NAMES } from '../../utils/format';
import { cn } from '../../utils/cn';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import type { Budget, ExpenseCategory } from '../../types';

const selectCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

export default function BudgetPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  // New budget form
  const [newCategory, setNewCategory] = useState<string>('');
  const [newAmount,   setNewAmount]   = useState('');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await expensesService.getBudgets(month, year);
      setBudgets(res.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };

  const handleSave = async () => {
    if (!newAmount || parseFloat(newAmount) <= 0) {
      toast('Enter a valid amount', 'error');
      return;
    }
    setSaving(true);
    try {
      await expensesService.setBudget({
        category: newCategory ? newCategory as ExpenseCategory : null,
        amount:   parseFloat(newAmount),
        currency: newCurrency,
        month,
        year,
      });
      toast('Budget saved', 'success');
      setNewCategory(''); setNewAmount(''); setNewCurrency('USD');
      load();
    } catch (err) { toast(getErrorMessage(err), 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await expensesService.deleteBudget(deleteTarget.id);
      setBudgets((p) => p.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast('Budget deleted', 'success');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Manager"
        description="Set and track spending limits"
        icon={Target}
        breadcrumb={['Expenses', 'Budgets']}
      />

      {/* Month Navigator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-4 flex items-center gap-4">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 text-center">
          <p className="text-lg font-extrabold text-slate-900">{MONTH_NAMES[month - 1]}</p>
          <p className="text-xs text-slate-500">{year}</p>
        </div>
        <button
          onClick={nextMonth}
          disabled={isCurrent}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Add Budget Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
        <p className="text-sm font-bold text-slate-700 mb-4">Add / Update Budget</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <SelectMenu
            ariaLabel="Budget category"
            value={newCategory}
            onChange={setNewCategory}
            options={[
              { value: '', label: 'Overall Budget' },
              ...Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="Amount"
            className={selectCls}
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
          />
          <SelectMenu
            ariaLabel="Budget currency"
            value={newCurrency}
            onChange={setNewCurrency}
            options={['USD', 'EUR', 'GBP', 'PKR', 'CAD', 'AUD', 'INR', 'AED'].map((c) => ({ value: c, label: c }))}
          />
          <Button variant="primary" leftIcon={Save} onClick={handleSave} loading={saving} className="w-full">
            Save Budget
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Select a category for a specific limit, or leave "Overall Budget" for total monthly spending limit.
        </p>
      </div>

      {loading ? <PageLoader /> : (
        <>
          {budgets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
              <Target size={40} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No budgets set for {MONTH_NAMES[month - 1]} {year}</p>
              <p className="text-slate-400 text-xs mt-1">Add one above to start tracking your spending limits.</p>
            </div>
          ) : (
            <>
              {/* Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Budget vs Actual</h3>
                <BudgetVsActualChart budgets={budgets} />
              </div>

              {/* Budget cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {budgets.map((b) => {
                  const spent  = b.spent ?? 0;
                  const budget = Number(b.amount);
                  const pct    = budget > 0 ? (spent / budget) * 100 : 0;
                  const isOver = spent > budget;
                  const isWarn = !isOver && pct >= 80;

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'bg-white rounded-2xl border p-5 shadow-card',
                        isOver ? 'border-red-200' : isWarn ? 'border-amber-200' : 'border-slate-200',
                      )}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            {isOver
                              ? <AlertTriangle size={14} className="text-red-600" />
                              : <CheckCircle size={14} className="text-green-600" />}
                            <p className="text-sm font-bold text-slate-900">
                              {b.category ? (EXPENSE_CATEGORY_LABELS[b.category] ?? b.category) : 'Overall Budget'}
                            </p>
                          </div>
                          <p className="text-xs text-slate-400">{b.currency}</p>
                        </div>
                        <button
                          onClick={() => setDeleteTarget(b)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className={cn('font-bold', isOver ? 'text-red-600' : 'text-slate-900')}>
                            {formatCurrency(spent, b.currency)}
                          </span>
                          <span className="text-slate-400">{formatCurrency(budget, b.currency)}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct, 100)}%` }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: isOver ? '#ef4444' : isWarn ? '#f59e0b' : '#22c55e' }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">{pct.toFixed(1)}% used</span>
                        <span className={cn('font-semibold', isOver ? 'text-red-600' : 'text-slate-600')}>
                          {isOver
                            ? `${formatCurrency(spent - budget, b.currency)} over`
                            : `${formatCurrency(budget - spent, b.currency)} left`}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Budget"
        description={`Remove the budget for "${deleteTarget?.category ? EXPENSE_CATEGORY_LABELS[deleteTarget.category] ?? deleteTarget.category : 'Overall'}"?`}
        confirmLabel="Delete"
        variant="destructive"
        icon={Trash2}
      />
    </div>
  );
}
