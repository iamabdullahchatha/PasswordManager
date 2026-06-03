import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, PieChart, TrendingUp, CreditCard, Target, Calendar, Download,
  Printer, RefreshCw, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { MonthlyBarChart } from '../../components/charts/MonthlyBarChart';
import { PaymentMethodDonutChart } from '../../components/charts/PaymentMethodDonutChart';
import { BudgetVsActualChart } from '../../components/charts/BudgetVsActualChart';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { expensesService, reportsService } from '../../services/expenses.service';
import {
  formatCurrency, EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS,
  PAYMENT_METHOD_LABELS, MONTH_NAMES, MONTH_SHORT,
} from '../../utils/format';
import { useCurrencyStore } from '../../store/currencyStore';
import { cn } from '../../utils/cn';
import { toast } from '../../hooks/useToast';

const now = new Date();
type ReportType = 'monthly' | 'yearly' | 'category' | 'payment' | 'budget' | 'compare';
const selectCls = 'px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';

function downloadCsv(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('monthly');
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState<any>(null);
  const [year,   setYear]         = useState(now.getFullYear());
  const [month,  setMonth]        = useState(now.getMonth() + 1);
  const [year2,  setYear2]        = useState(now.getFullYear() - 1);
  const [month2, setMonth2]       = useState(now.getMonth() + 1);
  const [budgets, setBudgets]     = useState<any[]>([]);
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      let res: any;
      switch (activeTab) {
        case 'monthly':  res = await reportsService.monthly(year, month);                       break;
        case 'yearly':   res = await reportsService.yearly(year);                               break;
        case 'category': res = await reportsService.category(year);                             break;
        case 'payment':  res = await reportsService.paymentMethod(year);                        break;
        case 'budget':   res = await reportsService.budget(month, year);                        break;
        case 'compare':  res = await reportsService.compareMonths(year, month, year2, month2);  break;
      }
      setData(res?.data ?? null);
      if (activeTab === 'budget') {
        const bRes = await expensesService.getBudgets(month, year);
        setBudgets(bRes.data ?? []);
      }
    } catch { toast('Failed to load report', 'error'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [activeTab, year, month, year2, month2]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = { year: String(year) };
      if (activeTab === 'monthly' || activeTab === 'budget') params.month = String(month);
      const blob = await expensesService.exportCsv(params);
      downloadCsv(blob, `report-${year}.csv`);
      toast('Exported', 'success');
    } catch { toast('Export failed', 'error'); } finally { setExporting(false); }
  };

  const TABS: { id: ReportType; label: string; icon: any }[] = [
    { id: 'monthly',  label: 'Monthly',        icon: Calendar   },
    { id: 'yearly',   label: 'Yearly',         icon: BarChart3  },
    { id: 'category', label: 'Category',       icon: PieChart   },
    { id: 'payment',  label: 'Payment',        icon: CreditCard },
    { id: 'budget',   label: 'Budget',         icon: Target     },
    { id: 'compare',  label: 'Compare',        icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Deep-dive analytics and insights"
        icon={BarChart3}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={Printer} onClick={() => window.print()}>Print</Button>
            <Button variant="outline" size="sm" leftIcon={Download} onClick={handleExport} loading={exporting}>Export CSV</Button>
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 border-b-2',
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-500 bg-blue-50/40'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50',
              )}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/40 flex flex-wrap gap-3 items-center">
          {(activeTab === 'monthly' || activeTab === 'budget') && (
            <>
              <select className={selectCls} value={month} onChange={(e) => setMonth(+e.target.value)}>
                {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
              </select>
              <select className={selectCls} value={year} onChange={(e) => setYear(+e.target.value)}>
                {[...Array(5)].map((_, i) => now.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
          {(activeTab === 'yearly' || activeTab === 'category' || activeTab === 'payment') && (
            <select className={selectCls} value={year} onChange={(e) => setYear(+e.target.value)}>
              {[...Array(5)].map((_, i) => now.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          {activeTab === 'compare' && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-600">Period 1:</span>
              <select className={selectCls} value={month} onChange={(e) => setMonth(+e.target.value)}>
                {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
              </select>
              <select className={selectCls} value={year} onChange={(e) => setYear(+e.target.value)}>
                {[...Array(5)].map((_, i) => now.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-slate-300">vs</span>
              <span className="text-xs font-semibold text-slate-600">Period 2:</span>
              <select className={selectCls} value={month2} onChange={(e) => setMonth2(+e.target.value)}>
                {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
              </select>
              <select className={selectCls} value={year2} onChange={(e) => setYear2(+e.target.value)}>
                {[...Array(5)].map((_, i) => now.getFullYear() - i).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          <button onClick={load} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data ? (
            <>
              {activeTab === 'monthly'  && <MonthlyContent  data={data} year={year} month={month} />}
              {activeTab === 'yearly'   && <YearlyContent   data={data} year={year} />}
              {activeTab === 'category' && <CategoryContent data={data} />}
              {activeTab === 'payment'  && <PaymentContent  data={data} />}
              {activeTab === 'budget'   && <BudgetContent   data={data} budgets={budgets} />}
              {activeTab === 'compare'  && <CompareContent  data={data} year={year} month={month} year2={year2} month2={month2} />}
            </>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <BarChart3 size={40} className="mx-auto mb-4 opacity-30" />
              <p>No data for the selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Monthly ─────────────────────────────────────────────────────────────────

function MonthlyContent({ data, year, month }: { data: any; year: number; month: number }) {
  const { currency } = useCurrencyStore();
  const fmt = (amount: number) => formatCurrency(amount, currency);
  return (
    <div className="space-y-6">
      <ReportHeader title={`${MONTH_NAMES[month - 1]} ${year}`} total={data.total} subtitle={`${data.count} transactions · Daily avg ${fmt(data.dailyAvg)}`} fmt={fmt} />
      {data.byStatus && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['PAID', 'PENDING', 'CANCELLED'].map((s) => (
            <div key={s} className={cn('rounded-2xl p-4 border', s === 'PAID' ? 'bg-green-50 border-green-100' : s === 'PENDING' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100')}>
              <p className="text-xs font-semibold text-slate-600 mb-1">{s.charAt(0) + s.slice(1).toLowerCase()}</p>
              <p className="text-lg font-extrabold text-slate-900">{fmt(data.byStatus[s]?.total ?? 0)}</p>
              <p className="text-xs text-slate-400">{data.byStatus[s]?.count ?? 0} tx</p>
            </div>
          ))}
        </div>
      )}
      {(data.highest || data.lowest) && (
        <div className="grid grid-cols-2 gap-4">
          {data.highest && <HighLow label="Highest" color="red" expense={data.highest} fmt={fmt} />}
          {data.lowest  && <HighLow label="Lowest"  color="green" expense={data.lowest} fmt={fmt} />}
        </div>
      )}
      <ChartsGrid byCategory={data.byCategory} byPayment={data.byPaymentMethod} total={data.total} />
      <CategoryTable data={data.byCategory} total={data.total} fmt={fmt} />
      {data.topExpenses?.length > 0 && <TopExpenses list={data.topExpenses} fmt={fmt} />}
    </div>
  );
}

// ─── Yearly ──────────────────────────────────────────────────────────────────

function YearlyContent({ data, year }: { data: any; year: number }) {
  const { currency } = useCurrencyStore();
  const fmt = (amount: number) => formatCurrency(amount, currency);
  return (
    <div className="space-y-6">
      <ReportHeader title={`Year ${year}`} total={data.total} subtitle={`Monthly avg: ${fmt(data.monthlyAvg)}`} fmt={fmt} />
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-blue-700">Highest Month</p>
          <p className="text-lg font-extrabold text-slate-900">{data.highestMonth ? MONTH_SHORT[data.highestMonth.month - 1] : '—'}</p>
          <p className="text-sm font-semibold text-blue-600">{fmt(data.highestMonth?.total ?? 0)}</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-green-700">Lowest Month</p>
          <p className="text-lg font-extrabold text-slate-900">{data.lowestMonth ? MONTH_SHORT[data.lowestMonth.month - 1] : '—'}</p>
          <p className="text-sm font-semibold text-green-600">{fmt(data.lowestMonth?.total ?? 0)}</p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Monthly Spending</h3>
        <MonthlyBarChart data={data.byMonth ?? []} highlightMonth={data.highestMonth?.month} />
      </div>
      <ChartsGrid byCategory={Object.fromEntries(Object.entries(data.byCategory ?? {}).map(([k, v]: any) => [k, v.total]))} byPayment={Object.fromEntries(Object.entries(data.byPaymentMethod ?? {}).map(([k, v]: any) => [k, v.total ?? v]))} total={data.total} />
      <CategoryTable data={data.byCategory} total={data.total} fmt={fmt} />
    </div>
  );
}

// ─── Category ────────────────────────────────────────────────────────────────

function CategoryContent({ data }: { data: any }) {
  const { currency } = useCurrencyStore();
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const entries = Object.entries(data?.byCategory ?? {}).sort(([, a]: any, [, b]: any) => b.total - a.total);
  return (
    <div className="space-y-6">
      <ReportHeader title={`Category Analysis ${data?.year}`} total={data?.total} subtitle="" fmt={fmt} />
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-orange-700">Most Spent</p>
            <p className="text-sm font-bold text-slate-900">{EXPENSE_CATEGORY_LABELS[(entries[0]?.[0] as string)] ?? entries[0]?.[0]}</p>
            <p className="text-xl font-extrabold text-orange-600">{fmt((entries[0]?.[1] as any)?.total)}</p>
          </div>
          <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-cyan-700">Least Spent</p>
            <p className="text-sm font-bold text-slate-900">{EXPENSE_CATEGORY_LABELS[(entries[entries.length - 1]?.[0] as string)] ?? entries[entries.length - 1]?.[0]}</p>
            <p className="text-xl font-extrabold text-cyan-600">{fmt((entries[entries.length - 1]?.[1] as any)?.total)}</p>
          </div>
        </div>
      )}
      <div className="bg-slate-50 rounded-2xl p-5">
        <CategoryPieChart data={Object.fromEntries(entries.map(([k, v]: any) => [k, v.total]))} height={280} />
      </div>
      <CategoryTable data={data?.byCategory} total={data?.total} fmt={fmt} />
    </div>
  );
}

// ─── Payment ─────────────────────────────────────────────────────────────────

function PaymentContent({ data }: { data: any }) {
  const { currency } = useCurrencyStore();
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const entries = Object.entries(data?.byMethod ?? {}).sort(([, a]: any, [, b]: any) => b.total - a.total);
  return (
    <div className="space-y-6">
      <ReportHeader title={`Payment Methods ${data?.year}`} total={data?.total} subtitle="" fmt={fmt} />
      <div className="bg-slate-50 rounded-2xl p-5">
        <PaymentMethodDonutChart data={Object.fromEntries(entries.map(([k, v]: any) => [k, v.total]))} height={260} />
      </div>
      <div className="space-y-3">
        {entries.map(([method, vals]: any, i) => {
          const pct = data.total > 0 ? (vals.total / data.total) * 100 : 0;
          return (
            <div key={method} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-5 font-mono">{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{PAYMENT_METHOD_LABELS[method] ?? method}</p>
                  <p className="text-xs text-slate-400">{vals.count} tx · {pct.toFixed(1)}%</p>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-900">{fmt(vals.total)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Budget ──────────────────────────────────────────────────────────────────

function BudgetContent({ data, budgets }: { data: any; budgets: any[] }) {
  const { currency } = useCurrencyStore();
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const isOver = (data?.totalSpent ?? 0) > (data?.totalBudget ?? 0);
  if (!budgets.length) return (
    <div className="text-center py-12 text-slate-400">
      <Target size={40} className="mx-auto mb-4 opacity-30" />
      <p className="text-sm">No budgets set for this period</p>
    </div>
  );
  return (
    <div className="space-y-6">
      <ReportHeader title={`Budget — ${MONTH_NAMES[(data?.month ?? 1) - 1]} ${data?.year}`} total={data?.totalSpent ?? 0} subtitle={`Budget: ${fmt(data?.totalBudget ?? 0)}`} fmt={fmt} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-blue-700 mb-1">Budget</p>
          <p className="text-xl font-extrabold text-slate-900">{fmt(data?.totalBudget ?? 0)}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-amber-700 mb-1">Spent</p>
          <p className="text-xl font-extrabold text-slate-900">{fmt(data?.totalSpent ?? 0)}</p>
        </div>
        <div className={cn('border rounded-2xl p-4 text-center', isOver ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100')}>
          <p className={cn('text-xs font-semibold mb-1', isOver ? 'text-red-700' : 'text-green-700')}>Remaining</p>
          <p className={cn('text-xl font-extrabold', isOver ? 'text-red-600' : 'text-green-600')}>
            {fmt(Math.abs(data?.remaining ?? 0))} {isOver ? 'over' : 'left'}
          </p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Budget vs Actual</h3>
        <BudgetVsActualChart budgets={budgets} />
      </div>
      <div className="space-y-3">
        {budgets.map((b) => {
          const over = (b.spent ?? 0) > Number(b.amount);
          const pct  = Number(b.amount) > 0 ? ((b.spent ?? 0) / Number(b.amount)) * 100 : 0;
          return (
            <div key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {over ? <AlertTriangle size={14} className="text-red-600" /> : <CheckCircle size={14} className="text-green-600" />}
                  <p className="text-sm font-semibold text-slate-900">{b.category ? (EXPENSE_CATEGORY_LABELS[b.category] ?? b.category) : 'Overall'}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">{fmt(b.spent ?? 0)}</span>
                  <span className="text-xs text-slate-400"> / {fmt(Number(b.amount))}</span>
                </div>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.6 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#22c55e' }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">{pct.toFixed(1)}% used</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Compare ─────────────────────────────────────────────────────────────────

function CompareContent({ data, year, month, year2, month2 }: any) {
  const { currency } = useCurrencyStore();
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const cur = data?.current; const prev = data?.previous; const pct = data?.changePercent ?? 0;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-900">Period Comparison</h2>
        <span className={cn('text-xl font-extrabold', pct >= 0 ? 'text-red-600' : 'text-green-600')}>
          {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <p className="text-xs font-semibold text-blue-700 mb-1">{MONTH_NAMES[month - 1]} {year}</p>
          <p className="text-2xl font-extrabold text-slate-900">{fmt(cur?.total ?? 0)}</p>
          <p className="text-xs text-slate-500 mt-1">{cur?.count ?? 0} transactions</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-600 mb-1">{MONTH_NAMES[month2 - 1]} {year2}</p>
          <p className="text-2xl font-extrabold text-slate-900">{fmt(prev?.total ?? 0)}</p>
          <p className="text-xs text-slate-500 mt-1">{prev?.count ?? 0} transactions</p>
        </div>
      </div>
      {cur?.byCategory && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-slate-50 rounded-2xl p-5">
            <p className="text-sm font-semibold text-slate-900 mb-3">{MONTH_NAMES[month - 1]} {year}</p>
            <CategoryPieChart data={Object.fromEntries(Object.entries(cur.byCategory).map(([k, v]: any) => [k, v.total ?? v]))} height={200} />
          </div>
          {prev?.byCategory && (
            <div className="bg-slate-50 rounded-2xl p-5">
              <p className="text-sm font-semibold text-slate-900 mb-3">{MONTH_NAMES[month2 - 1]} {year2}</p>
              <CategoryPieChart data={Object.fromEntries(Object.entries(prev.byCategory).map(([k, v]: any) => [k, v.total ?? v]))} height={200} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function ReportHeader({ title, total, subtitle, fmt }: { title: string; total: number; subtitle: string; fmt: (n: number) => string }) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 pb-4">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-2xl font-extrabold text-slate-900">{fmt(total)}</p>
        <p className="text-xs text-slate-500">Total</p>
      </div>
    </div>
  );
}

function HighLow({ label, color, expense, fmt }: { label: string; color: 'red' | 'green'; expense: any; fmt: (n: number) => string }) {
  return (
    <div className={cn('rounded-2xl p-4 border', color === 'red' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100')}>
      <p className={cn('text-xs font-semibold mb-1', color === 'red' ? 'text-red-700' : 'text-green-700')}>{label} Expense</p>
      <p className="text-sm font-bold text-slate-900 truncate">{expense.title}</p>
      <p className={cn('text-xl font-extrabold', color === 'red' ? 'text-red-600' : 'text-green-600')}>{fmt(Number(expense.amount))}</p>
    </div>
  );
}

function ChartsGrid({ byCategory, byPayment, total }: { byCategory: any; byPayment: any; total: number }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {byCategory && Object.keys(byCategory).length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">By Category</h3>
          <CategoryPieChart data={byCategory} height={220} />
        </div>
      )}
      {byPayment && Object.keys(byPayment).length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">By Payment Method</h3>
          <PaymentMethodDonutChart data={byPayment} height={220} />
        </div>
      )}
    </div>
  );
}

function CategoryTable({ data, total, fmt }: { data: Record<string, any> | undefined | null; total: number; fmt: (n: number) => string }) {
  if (!data || !Object.keys(data).length) return null;
  const entries = Object.entries(data).sort(([, a], [, b]) => (b as any).total - (a as any).total);
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Category Breakdown</h3>
      <div className="space-y-2">
        {entries.map(([cat, vals]: any) => {
          const pct = total > 0 ? (vals.total / total) * 100 : 0;
          return (
            <div key={cat} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: EXPENSE_CATEGORY_COLORS[cat] ?? '#6b7280' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-900 truncate">{EXPENSE_CATEGORY_LABELS[cat] ?? cat}</span>
                  <span className="text-sm font-bold text-slate-900 ml-2">{fmt(vals.total)}</span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: EXPENSE_CATEGORY_COLORS[cat] ?? '#6b7280' }} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{vals.count} tx · {pct.toFixed(1)}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopExpenses({ list, fmt }: { list: any[]; fmt: (n: number) => string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Top Expenses</h3>
      <div className="space-y-2">
        {list.slice(0, 5).map((e: any, i: number) => (
          <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 w-5 font-mono">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                <p className="text-xs text-slate-400">{EXPENSE_CATEGORY_LABELS[e.category] ?? e.category}</p>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900">{fmt(Number(e.amount))}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
