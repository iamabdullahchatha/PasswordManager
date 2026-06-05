import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Download, FileImage, FileText, CheckCircle2, Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  formatCurrency, formatDate,
  EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_COLORS,
  PAYMENT_METHOD_LABELS, EXPENSE_STATUS_LABELS, EXPENSE_STATUS_COLORS,
  MONTH_NAMES,
} from '../../utils/format';
import { cn } from '../../utils/cn';
import { expensesService } from '../../services/expenses.service';
import type { Expense } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  currency: string;
  /** month omitted → full-year report */
  period: { year: number; month?: number };
}

const MAX_ROWS = 200;

const BACKDROP_V = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};
const PANEL_V = {
  initial: { opacity: 0, scale: 0.96, y: 14 },
  animate: { opacity: 1, scale: 1,    y: 0,  transition: { type: 'spring' as const, stiffness: 360, damping: 28 } },
  exit:    { opacity: 0, scale: 0.96, y: 14, transition: { duration: 0.15 } },
};

interface Stats {
  total: number;
  count: number;
  paid: number;
  pending: number;
  cancelled: number;
  pendingCount: number;
  dailyAvg: number;
  byCategory: Record<string, { total: number; count: number }>;
  byPaymentMethod: Record<string, { total: number; count: number }>;
}

function computeStats(expenses: Expense[], period: { year: number; month?: number }): Stats {
  const byCategory: Record<string, { total: number; count: number }> = {};
  const byPaymentMethod: Record<string, { total: number; count: number }> = {};
  let total = 0, paid = 0, pending = 0, cancelled = 0, pendingCount = 0;

  for (const e of expenses) {
    const amt = Number(e.amount) || 0;
    if (e.status === 'CANCELLED') { cancelled += amt; continue; }
    total += amt;
    if (e.status === 'PAID') paid += amt;
    if (e.status === 'PENDING') { pending += amt; pendingCount += 1; }

    const c = e.category ?? 'OTHER';
    (byCategory[c] ??= { total: 0, count: 0 });
    byCategory[c].total += amt; byCategory[c].count += 1;

    const pm = e.paymentMethod ?? 'OTHER';
    (byPaymentMethod[pm] ??= { total: 0, count: 0 });
    byPaymentMethod[pm].total += amt; byPaymentMethod[pm].count += 1;
  }

  let divisor: number;
  if (period.month) {
    const now = new Date();
    const isCurrent = now.getFullYear() === period.year && now.getMonth() + 1 === period.month;
    divisor = isCurrent ? now.getDate() : new Date(period.year, period.month, 0).getDate();
  } else {
    divisor = 12; // yearly → per-month average
  }
  const dailyAvg = divisor > 0 ? total / divisor : 0;

  return { total, count: expenses.filter(e => e.status !== 'CANCELLED').length, paid, pending, cancelled, pendingCount, dailyAvg, byCategory, byPaymentMethod };
}

export function ReportExportModal({ open, onClose, currency, period }: Props) {
  const [format, setFormat] = useState<'pdf' | 'image'>('pdf');
  const [state, setState]   = useState<'idle' | 'loading' | 'done'>('idle');
  const [fetching, setFetching] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  const isYearly = !period.month;
  const month    = period.month ? MONTH_NAMES[(period.month - 1 + 12) % 12] : '';
  const periodLabel = isYearly ? `Year ${period.year}` : `${month} ${period.year}`;

  // Fetch the full expense set for the period whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFetching(true);
    setState('idle');
    const params: Record<string, string> = {
      year: String(period.year),
      limit: '1000',
      sortBy: 'date',
      sortOrder: 'desc',
    };
    if (period.month) params.month = String(period.month);

    expensesService.list(params)
      .then((res) => {
        if (cancelled) return;
        const list = res.data ?? [];
        setExpenses(list);
        setStats(computeStats(list, period));
      })
      .catch(() => { if (!cancelled) { setExpenses([]); setStats(computeStats([], period)); } })
      .finally(() => { if (!cancelled) setFetching(false); });

    return () => { cancelled = true; };
  }, [open, period.year, period.month]);

  const fmt = (n: number) => formatCurrency(n, currency);
  const now = new Date();
  const generated = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const handleDownload = async () => {
    if (!templateRef.current || !stats) return;
    setState('loading');
    try {
      const el = templateRef.current;
      el.style.display = 'block';
      await new Promise(r => setTimeout(r, 80));

      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 1120,
      });

      el.style.display = 'none';

      const filename = isYearly
        ? `SecureVault-Report-${period.year}`
        : `SecureVault-Report-${period.year}-${String(period.month).padStart(2, '0')}`;

      if (format === 'image') {
        const a = document.createElement('a');
        a.download = `${filename}.png`;
        a.href = canvas.toDataURL('image/png', 1.0);
        a.click();
      } else {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf     = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageW   = pdf.internal.pageSize.getWidth();
        const pageH   = pdf.internal.pageSize.getHeight();
        const ratio   = pageW / canvas.width;
        const totalH  = canvas.height * ratio;
        let   yOffset = 0;
        while (yOffset < totalH) {
          pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, totalH);
          yOffset += pageH;
          if (yOffset < totalH) pdf.addPage();
        }
        pdf.save(`${filename}.pdf`);
      }

      setState('done');
      setTimeout(() => { setState('idle'); onClose(); }, 1600);
    } catch {
      setState('idle');
    }
  };

  const busy = state !== 'idle' || fetching;

  return (
    <>
      {/* ── Off-screen report template ─────────────────────────────────────── */}
      {open && stats && (
        <div
          ref={templateRef}
          style={{
            position: 'fixed', left: '-9999px', top: 0, width: '1100px',
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
            background: '#ffffff', display: 'none',
          }}
        >
          <ReportTemplate
            expenses={expenses}
            stats={stats}
            currency={currency}
            periodLabel={periodLabel}
            isYearly={isYearly}
            generated={generated}
            fmt={fmt}
          />
        </div>
      )}

      {/* ── Modal UI ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              variants={BACKDROP_V} initial="initial" animate="animate" exit="exit"
              className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm"
              onClick={onClose}
            />

            <motion.div
              variants={PANEL_V} initial="initial" animate="animate" exit="exit"
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/60 z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <Download size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Download Report</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {periodLabel} · {fetching ? 'loading…' : `${expenses.length} expenses`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Format selector */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Choose Format</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'pdf',   label: 'PDF Document', sub: 'Best for printing & sharing', Icon: FileText,  color: 'from-red-500 to-rose-500' },
                      { value: 'image', label: 'PNG Image',    sub: 'Quick preview & social share', Icon: FileImage, color: 'from-blue-500 to-indigo-500' },
                    ] as const).map(({ value, label, sub, Icon, color }) => (
                      <button
                        key={value}
                        onClick={() => setFormat(value)}
                        className={cn(
                          'relative flex flex-col items-start gap-2.5 p-4 rounded-xl border-2 text-left transition-all duration-150',
                          format === value
                            ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white',
                        )}
                      >
                        <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-sm', color)}>
                          <Icon size={16} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                        </div>
                        {format === value && (
                          <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Includes */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-700 mb-3">Report Includes</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Company branding & logo',
                      'Summary statistics',
                      `${expenses.length} transactions`,
                      'Category breakdown',
                      'Payment method split',
                      'Powered by WebCore Solutions UAE',
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <span className="text-xs text-slate-600">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  disabled={busy || expenses.length === 0}
                  className={cn(
                    'w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2',
                    state === 'done'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_14px_rgba(37,99,235,0.35)]',
                    (busy || expenses.length === 0) && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  {fetching ? (
                    <><Loader2 size={16} className="animate-spin" /> Loading data…</>
                  ) : state === 'loading' ? (
                    <><Loader2 size={16} className="animate-spin" /> Generating {format === 'pdf' ? 'PDF' : 'Image'}…</>
                  ) : state === 'done' ? (
                    <><CheckCircle2 size={16} /> Downloaded Successfully!</>
                  ) : expenses.length === 0 ? (
                    <>No expenses for this period</>
                  ) : (
                    <><Download size={16} /> Download as {format === 'pdf' ? 'PDF' : 'PNG Image'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Brand mark (inline SVG — renders crisp & centered in html2canvas) ──────── */
function ShieldMark({ size = 30 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <path
        d="M12 2.2 4.6 5.1v6.2c0 4.6 3.1 7.9 7.4 9.4 4.3-1.5 7.4-4.8 7.4-9.4V5.1L12 2.2z"
        fill="#ffffff"
      />
      <path
        d="M9.1 12.1 11.1 14.1 15 10.2"
        stroke="#1e40af"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/* ── Report Template (rendered off-screen, captured by html2canvas) ─────────── */
function ReportTemplate({
  expenses, stats, currency, periodLabel, isYearly, generated, fmt,
}: {
  expenses: Expense[];
  stats: Stats;
  currency: string;
  periodLabel: string;
  isYearly: boolean;
  generated: string;
  fmt: (n: number) => string;
}) {
  const topCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 8);
  const categoryTotal = topCategories.reduce((s, [, v]) => s + v.total, 0) || 1;

  const paymentRows = Object.entries(stats.byPaymentMethod)
    .sort(([, a], [, b]) => b.total - a.total);
  const paymentTotal = paymentRows.reduce((s, [, v]) => s + v.total, 0) || 1;

  const rows = expenses.slice(0, MAX_ROWS);
  const overflow = expenses.length - rows.length;

  return (
    <div style={{ background: '#fff', minHeight: '100%', color: '#0f172a', lineHeight: 1.5 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3730a3 100%)', padding: '36px 48px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
              <ShieldMark size={30} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.3 }}>SecureVault Pro</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, lineHeight: 1.4 }}>
                {isYearly ? 'Annual' : 'Monthly'} Expense Report · {periodLabel}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, lineHeight: 1.4 }}>Powered by</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 2, lineHeight: 1.4 }}>WebCore Solutions UAE</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, lineHeight: 1.4 }}>Generated: {generated}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
          {['#60a5fa','#818cf8','#a78bfa','#c084fc','#f472b6'].map((c, i) => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 99, background: c, opacity: 0.7 }} />
          ))}
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 48px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Financial Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Total Spent',  value: fmt(stats.total),    sub: `${stats.count} transactions`,         color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Paid',         value: fmt(stats.paid),     sub: 'Settled expenses',                     color: '#10b981', bg: '#ecfdf5' },
            { label: 'Pending',      value: fmt(stats.pending),  sub: `${stats.pendingCount} awaiting payment`, color: '#f59e0b', bg: '#fffbeb' },
            { label: isYearly ? 'Monthly Avg' : 'Daily Average', value: fmt(stats.dailyAvg), sub: isYearly ? 'Average per month' : 'Average per day', color: '#8b5cf6', bg: '#f5f3ff' },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 14, padding: '16px 18px', border: `1.5px solid ${color}22` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 6, letterSpacing: '-0.5px' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, background: '#f8fafc', borderRadius: 12, padding: '12px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>Reporting Period: </span>{periodLabel}
          </div>
          {stats.cancelled > 0 && (
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>Cancelled: </span>{fmt(stats.cancelled)}
            </div>
          )}
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
            Display Currency: <span style={{ fontWeight: 700, color: '#0f172a' }}>{currency}</span>
          </div>
        </div>
      </div>

      {/* ── Category Breakdown ─────────────────────────────────────────────── */}
      {topCategories.length > 0 && (
        <div style={{ padding: '24px 48px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Category Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {topCategories.map(([cat, data]) => {
              const color = EXPENSE_CATEGORY_COLORS[cat] ?? '#6b7280';
              const pct   = Math.round((data.total / categoryTotal) * 100);
              return (
                <div key={cat} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{EXPENSE_CATEGORY_LABELS[cat] ?? cat}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{fmt(data.total)}</div>
                  <div style={{ marginTop: 6, height: 4, background: '#e2e8f0', borderRadius: 99 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>{pct}% · {data.count} expense{data.count !== 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Payment Methods ────────────────────────────────────────────────── */}
      {paymentRows.length > 0 && (
        <div style={{ padding: '24px 48px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Payment Methods</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {paymentRows.map(([pm, data]) => {
              const pct = Math.round((data.total / paymentTotal) * 100);
              return (
                <div key={pm} style={{ flex: '1 1 0', minWidth: 150, background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>{PAYMENT_METHOD_LABELS[pm] ?? pm}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{fmt(data.total)}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{pct}% · {data.count} txn</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transactions Table ─────────────────────────────────────────────── */}
      <div style={{ padding: '24px 48px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
          Expense Transactions ({expenses.length})
        </div>

        <div style={{ borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 100px 80px 90px 80px 80px 90px', background: 'linear-gradient(90deg,#1e3a5f,#1e40af)', padding: '10px 16px', gap: 8 }}>
            {['#', 'Title / Vendor', 'Amount', 'Currency', 'Category', 'Method', 'Status', 'Date'].map((h) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.5 }}>{h}</div>
            ))}
          </div>

          {rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px', color: '#94a3b8', fontSize: 13 }}>No expenses for this period</div>
          ) : (
            rows.map((exp, i) => {
              const statusColor = EXPENSE_STATUS_COLORS[exp.status] ?? '#6b7280';
              const catColor    = EXPENSE_CATEGORY_COLORS[exp.category] ?? '#6b7280';
              return (
                <div key={exp.id} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 100px 80px 90px 80px 80px 90px', padding: '9px 16px', gap: 8, background: i % 2 === 0 ? '#fff' : '#f8fafc', borderTop: '1px solid #f1f5f9', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{i + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.title}</div>
                    {exp.vendor && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.vendor}</div>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>{formatCurrency(Number(exp.amount), exp.currency)}</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{exp.currency}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#475569', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{EXPENSE_CATEGORY_LABELS[exp.category] ?? exp.category}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{PAYMENT_METHOD_LABELS[exp.paymentMethod] ?? exp.paymentMethod}</div>
                  <div>
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 600, lineHeight: 1.5, padding: '2px 7px', borderRadius: 99, background: `${statusColor}18`, color: statusColor }}>{EXPENSE_STATUS_LABELS[exp.status] ?? exp.status}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>{formatDate(exp.date)}</div>
                </div>
              );
            })
          )}
          {overflow > 0 && (
            <div style={{ textAlign: 'center', padding: '12px', fontSize: 11, color: '#94a3b8', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              + {overflow} more transaction{overflow !== 1 ? 's' : ''} not shown (showing first {MAX_ROWS})
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{ margin: '28px 48px 0', padding: '18px 24px', background: 'linear-gradient(135deg, #1e3a5f, #1e40af)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldMark size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>SecureVault Pro</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1, lineHeight: 1.4 }}>Financial Expense Report · Confidential</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>WebCore Solutions UAE</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1, lineHeight: 1.4 }}>© {new Date().getFullYear()} All Rights Reserved</div>
        </div>
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}
