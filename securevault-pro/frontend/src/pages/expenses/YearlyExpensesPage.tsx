import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, PieChart as PieIcon, Download, ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { MonthlyBarChart } from '../../components/charts/MonthlyBarChart';
import { CategoryPieChart } from '../../components/charts/CategoryPieChart';
import { PaymentMethodDonutChart } from '../../components/charts/PaymentMethodDonutChart';
import { MonthComparisonChart } from '../../components/charts/MonthComparisonChart';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { expensesService } from '../../services/expenses.service';
import { formatCurrency, EXPENSE_CATEGORY_LABELS, MONTH_SHORT } from '../../utils/format';
import { useCurrencyStore } from '../../store/currencyStore';
import { cn } from '../../utils/cn';
import { toast } from '../../hooks/useToast';

function downloadCsv(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function YearlyExpensesPage() {
  const { currency } = useCurrencyStore();
  const fmt = (amount: number) => formatCurrency(amount, currency);

  const now  = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [data,  setData]  = useState<any>(null);
  const [compareData, setCompareData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      expensesService.getYearly(year),
      expensesService.compareYears(year, year - 1),
    ]).then(([res, cmpRes]) => {
      setData(res.data);
      setCompareData(cmpRes.data);
    }).finally(() => setLoading(false));
  }, [year]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await expensesService.exportCsv({ year: String(year) });
      downloadCsv(blob, `expenses-${year}.csv`);
      toast('Exported successfully', 'success');
    } catch { toast('Export failed', 'error'); } finally { setExporting(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Yearly Overview"
        description={`Complete financial summary for ${year}`}
        icon={BarChart3}
        action={
          <Button variant="outline" size="sm" leftIcon={Download} onClick={handleExport} loading={exporting}>
            Export CSV
          </Button>
        }
      />

      {/* ── Year Navigator ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-6 bg-white rounded-2xl border border-slate-200 shadow-card p-4 w-fit mx-auto">
        <button onClick={() => setYear((y) => y - 1)} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <p className="text-2xl font-extrabold text-slate-900 w-20 text-center">{year}</p>
        <button
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= now.getFullYear()}
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? <PageLoader /> : data && (
        <>
          {/* ── Summary Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Spent',        value: fmt(data.total),               icon: BarChart3,    gradient: 'from-blue-500 to-blue-600'      },
              { label: 'Monthly Average',    value: fmt(data.total / 12),           icon: TrendingUp,   gradient: 'from-emerald-500 to-emerald-600' },
              { label: 'Best Month',         value: MONTH_SHORT[(data.highestMonth?.month ?? 1) - 1], icon: TrendingUp, gradient: 'from-orange-500 to-orange-600' },
              { label: 'Total Transactions', value: String(data.expenses?.length ?? 0),        icon: TrendingDown, gradient: 'from-violet-500 to-violet-600'  },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', s.gradient)}>
                    <s.icon size={14} className="text-white" />
                  </div>
                </div>
                <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
                {s.label === 'Best Month' && data.highestMonth && (
                  <p className="text-xs text-slate-500 mt-1">{fmt(data.highestMonth.total)}</p>
                )}
              </motion.div>
            ))}
          </div>

          {/* ── Year Comparison ───────────────────────────────────────── */}
          {compareData && (
            <div className={cn(
              'rounded-2xl border p-5 flex items-center justify-between flex-wrap gap-4',
              compareData.changePercent >= 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100',
            )}>
              <div>
                <p className="text-xs font-semibold text-slate-600">Year-over-Year Comparison</p>
                <p className="text-sm text-slate-700 mt-1">
                  {year} vs {year - 1}: {fmt(compareData.year1?.total ?? 0)} vs {fmt(compareData.year2?.total ?? 0)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {compareData.changePercent >= 0
                  ? <ArrowUpRight size={20} className="text-red-600" />
                  : <ArrowDownRight size={20} className="text-green-600" />
                }
                <span className={cn('text-xl font-extrabold', compareData.changePercent >= 0 ? 'text-red-700' : 'text-green-700')}>
                  {compareData.changePercent > 0 ? '+' : ''}{compareData.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* ── Monthly Bar Chart ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <BarChart3 size={14} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Monthly Breakdown</h3>
                <p className="text-xs text-slate-500">Spending per month in {year}</p>
              </div>
            </div>
            <div className="p-5">
              <MonthlyBarChart data={data.byMonth ?? []} highlightMonth={data.highestMonth?.month} />
            </div>
          </div>

          {/* ── Month Comparison Chart ────────────────────────────────── */}
          {compareData?.year1 && compareData?.year2 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Month-by-Month Comparison</h3>
                <p className="text-xs text-slate-500">{year} vs {year - 1}</p>
              </div>
              <div className="p-5">
                <MonthComparisonChart current={compareData.year1.byMonth} previous={compareData.year2.byMonth} currentYear={year} prevYear={year - 1} />
              </div>
            </div>
          )}

          {/* ── Category + Payment Method ─────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {data.byCategory && Object.keys(data.byCategory).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <PieIcon size={14} className="text-violet-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">Spending by Category</p>
                </div>
                <div className="p-5">
                  <CategoryPieChart data={Object.fromEntries(Object.entries(data.byCategory).map(([k, v]: any) => [k, v.total]))} />
                </div>
              </div>
            )}

            {data.byPaymentMethod && Object.keys(data.byPaymentMethod).length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CreditCard size={14} className="text-blue-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">By Payment Method</p>
                </div>
                <div className="p-5">
                  <PaymentMethodDonutChart data={Object.fromEntries(Object.entries(data.byPaymentMethod).map(([k, v]: any) => [k, v.total ?? v]))} />
                </div>
              </div>
            )}
          </div>

          {/* ── Category Table ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">Category Breakdown</p>
            </div>
            <div className="divide-y divide-slate-50">
              {Object.entries(data.byCategory ?? {})
                .sort(([, a]: any, [, b]: any) => b.total - a.total)
                .map(([cat, vals]: any, i) => (
                  <div key={cat} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-400 w-5 font-mono">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{EXPENSE_CATEGORY_LABELS[cat] ?? cat}</p>
                        <p className="text-xs text-slate-400">{vals.count} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{fmt(vals.total)}</p>
                      <p className="text-xs text-slate-400">{vals.percentage?.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
