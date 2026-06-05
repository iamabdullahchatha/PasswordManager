import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Download, FileImage, FileText, CheckCircle2, Loader2,
  Shield, TrendingUp, DollarSign, Clock, BarChart3, Calendar,
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
import type { Expense, Budget } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  expenses: Expense[];
  summary: any;
  budgets: Budget[];
  currency: string;
  period: { year: number; month: number };
}

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

export function ReportExportModal({ open, onClose, expenses, summary, currency, period }: Props) {
  const [format, setFormat] = useState<'pdf' | 'image'>('pdf');
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const templateRef = useRef<HTMLDivElement>(null);

  const fmt   = (n: number) => formatCurrency(n, currency);
  const month = MONTH_NAMES[(period.month - 1 + 12) % 12];
  const now   = new Date();
  const generated = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const monthlyTotal   = summary?.monthly?.total   ?? 0;
  const yearlyTotal    = summary?.yearly?.total    ?? 0;
  const dailyAvg       = summary?.dailyAvg         ?? 0;
  const pendingTotal   = summary?.pending?.total   ?? 0;
  const pendingCount   = summary?.pending?.count   ?? 0;
  const growthPct      = summary?.growthPct        ?? 0;
  const prevMonthTotal = summary?.prevMonth?.total ?? 0;

  const byCategory = summary?.monthly?.byCategory ?? {};

  const handleDownload = async () => {
    if (!templateRef.current) return;
    setState('loading');
    try {
      const el = templateRef.current;
      el.style.display = 'block';
      await new Promise(r => setTimeout(r, 80));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1120,
      });

      el.style.display = 'none';

      const filename = `SecureVault-Report-${period.year}-${String(period.month).padStart(2, '0')}`;

      if (format === 'image') {
        const a = document.createElement('a');
        a.download = `${filename}.png`;
        a.href = canvas.toDataURL('image/png', 1.0);
        a.click();
      } else {
        const imgData  = canvas.toDataURL('image/png', 1.0);
        const pdf      = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pageW    = pdf.internal.pageSize.getWidth();
        const pageH    = pdf.internal.pageSize.getHeight();
        const imgW     = canvas.width;
        const imgH     = canvas.height;
        const ratio    = pageW / imgW;
        const totalH   = imgH * ratio;
        let   yOffset  = 0;

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

  return (
    <>
      {/* ── Off-screen report template (always mounted when modal is open) ─── */}
      {open && (
        <div
          ref={templateRef}
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '1100px',
            fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
            background: '#ffffff',
            display: 'none',
          }}
        >
          <ReportTemplate
            expenses={expenses}
            summary={summary}
            currency={currency}
            period={period}
            month={month}
            generated={generated}
            fmt={fmt}
            monthlyTotal={monthlyTotal}
            yearlyTotal={yearlyTotal}
            dailyAvg={dailyAvg}
            pendingTotal={pendingTotal}
            pendingCount={pendingCount}
            growthPct={growthPct}
            prevMonthTotal={prevMonthTotal}
            byCategory={byCategory}
          />
        </div>
      )}

      {/* ── Modal UI ─────────────────────────────────────────────────────────── */}
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
                    <p className="text-xs text-slate-500 mt-0.5">{month} {period.year} · {expenses.length} expenses</p>
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

                {/* Preview info */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-700 mb-3">Report Includes</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      'Company branding & logo',
                      'Summary statistics',
                      `${expenses.length} expense transactions`,
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
                  disabled={state !== 'idle'}
                  className={cn(
                    'w-full h-11 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2',
                    state === 'done'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_4px_14px_rgba(37,99,235,0.35)]',
                    state !== 'idle' && 'opacity-90 cursor-not-allowed',
                  )}
                >
                  {state === 'loading' ? (
                    <><Loader2 size={16} className="animate-spin" /> Generating {format === 'pdf' ? 'PDF' : 'Image'}…</>
                  ) : state === 'done' ? (
                    <><CheckCircle2 size={16} /> Downloaded Successfully!</>
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

/* ── Report Template (rendered off-screen, captured by html2canvas) ─────────── */
function ReportTemplate({
  expenses, currency, period, month, generated, fmt,
  monthlyTotal, yearlyTotal, dailyAvg, pendingTotal, pendingCount,
  growthPct, prevMonthTotal, byCategory,
}: {
  expenses: Expense[];
  summary: any;
  currency: string;
  period: { year: number; month: number };
  month: string;
  generated: string;
  fmt: (n: number) => string;
  monthlyTotal: number;
  yearlyTotal: number;
  dailyAvg: number;
  pendingTotal: number;
  pendingCount: number;
  growthPct: number;
  prevMonthTotal: number;
  byCategory: Record<string, { total: number; count: number }>;
}) {
  const topCategories = Object.entries(byCategory)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 8);

  const categoryTotal = topCategories.reduce((s, [, v]) => s + v.total, 0) || 1;

  return (
    <div style={{ background: '#fff', minHeight: '100%', color: '#0f172a' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3730a3 100%)',
        padding: '36px 48px 32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid rgba(255,255,255,0.3)',
            }}>
              <span style={{ fontSize: 26 }}>🛡️</span>
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>SecureVault Pro</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>Expense Report · {month} {period.year}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Powered by</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 2 }}>WebCore Solutions UAE</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Generated: {generated}</div>
          </div>
        </div>

        {/* Decorative stripe */}
        <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
          {['#60a5fa','#818cf8','#a78bfa','#c084fc','#f472b6'].map((c, i) => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 99, background: c, opacity: 0.7 }} />
          ))}
        </div>
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div style={{ padding: '28px 48px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
          Financial Summary
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'This Month',    value: fmt(monthlyTotal),    sub: `${expenses.length} transactions`,  color: '#10b981', bg: '#ecfdf5' },
            { label: 'Year to Date',  value: fmt(yearlyTotal),     sub: 'All expenses this year',           color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Daily Average', value: fmt(dailyAvg),        sub: 'Average per day',                 color: '#8b5cf6', bg: '#f5f3ff' },
            { label: 'Pending',       value: fmt(pendingTotal),    sub: `${pendingCount} awaiting payment`, color: '#f59e0b', bg: '#fffbeb' },
          ].map(({ label, value, sub, color, bg }) => (
            <div key={label} style={{
              background: bg,
              borderRadius: 14,
              padding: '16px 18px',
              border: `1.5px solid ${color}22`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 6, letterSpacing: '-0.5px' }}>{value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Month vs prev month comparison */}
        <div style={{ marginTop: 14, background: '#f8fafc', borderRadius: 12, padding: '12px 18px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>Month-over-Month: </span>
            <span style={{ color: growthPct >= 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
              {growthPct >= 0 ? '▲' : '▼'} {Math.abs(growthPct).toFixed(1)}%
            </span>
            <span style={{ color: '#94a3b8', marginLeft: 8 }}>vs last month ({fmt(prevMonthTotal)})</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
            Currency: <span style={{ fontWeight: 700, color: '#0f172a' }}>{currency}</span>
          </div>
        </div>
      </div>

      {/* ── Category Breakdown ─────────────────────────────────────────────── */}
      {topCategories.length > 0 && (
        <div style={{ padding: '24px 48px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
            Category Breakdown
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {topCategories.map(([cat, data]) => {
              const color = EXPENSE_CATEGORY_COLORS[cat] ?? '#6b7280';
              const pct   = Math.round((data.total / categoryTotal) * 100);
              return (
                <div key={cat} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {EXPENSE_CATEGORY_LABELS[cat] ?? cat}
                    </span>
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

      {/* ── Transactions Table ─────────────────────────────────────────────── */}
      <div style={{ padding: '24px 48px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
          Expense Transactions ({expenses.length})
        </div>

        <div style={{ borderRadius: 12, border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Table head */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '28px 1fr 100px 80px 90px 80px 80px 90px',
            background: 'linear-gradient(90deg,#1e3a5f,#1e40af)',
            padding: '10px 16px',
            gap: 8,
          }}>
            {['#', 'Title / Vendor', 'Amount', 'Currency', 'Category', 'Method', 'Status', 'Date'].map((h) => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {expenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px', color: '#94a3b8', fontSize: 13 }}>No expenses for this period</div>
          ) : (
            expenses.map((exp, i) => {
              const statusColor = EXPENSE_STATUS_COLORS[exp.status] ?? '#6b7280';
              const catColor    = EXPENSE_CATEGORY_COLORS[exp.category] ?? '#6b7280';
              return (
                <div
                  key={exp.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '28px 1fr 100px 80px 90px 80px 80px 90px',
                    padding: '9px 16px',
                    gap: 8,
                    background: i % 2 === 0 ? '#fff' : '#f8fafc',
                    borderTop: '1px solid #f1f5f9',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{i + 1}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.title}</div>
                    {exp.vendor && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.vendor}</div>}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(Number(exp.amount), exp.currency)}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{exp.currency}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {EXPENSE_CATEGORY_LABELS[exp.category] ?? exp.category}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {PAYMENT_METHOD_LABELS[exp.paymentMethod] ?? exp.paymentMethod}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                      background: `${statusColor}18`, color: statusColor,
                    }}>
                      {EXPENSE_STATUS_LABELS[exp.status] ?? exp.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{formatDate(exp.date)}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{
        margin: '28px 48px 0',
        padding: '18px 24px',
        background: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>SecureVault Pro</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>Financial Expense Report · Confidential</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>WebCore Solutions UAE</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>© {new Date().getFullYear()} All Rights Reserved</div>
        </div>
      </div>

      <div style={{ height: 32 }} />
    </div>
  );
}
