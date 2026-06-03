import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useCurrencyStore, SUPPORTED_CURRENCIES, type CurrencyCode } from '../../store/currencyStore';
import { cn } from '../../utils/cn';

const CURRENCY_COLORS: Record<string, string> = {
  USD: '#22c55e', EUR: '#3b82f6', GBP: '#8b5cf6',
  PKR: '#10b981', INR: '#f97316', CAD: '#ef4444',
  AUD: '#06b6d4', AED: '#f59e0b', SAR: '#84cc16',
  JPY: '#ec4899', CNY: '#f43f5e', CHF: '#6366f1',
  SGD: '#14b8a6', MYR: '#eab308', TRY: '#a855f7',
  BRL: '#22d3ee', MXN: '#16a34a', ZAR: '#dc2626',
  KWD: '#7c3aed', QAR: '#0891b2',
};

const DROPDOWN_V = {
  initial: { opacity: 0, scale: 0.95, y: -8 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 420, damping: 30 },
  },
  exit: {
    opacity: 0, scale: 0.95, y: -8,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
};

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-all duration-150 select-none',
          open
            ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-inner-blue'
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
        )}
      >
        <Globe size={12} className={cn('flex-shrink-0', open ? 'text-blue-500' : 'text-slate-400')} />
        <span className="font-semibold tracking-wide">{currency}</span>
        <ChevronDown
          size={11}
          className={cn(
            'flex-shrink-0 transition-transform duration-200',
            open ? 'rotate-180 text-blue-500' : 'text-slate-400',
          )}
        />
      </button>

      {/* ── Dropdown Panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Select display currency"
            variants={DROPDOWN_V}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute right-0 top-[calc(100%+6px)] w-56 bg-white rounded-2xl border border-slate-200/80 shadow-modal z-overlay overflow-hidden origin-top-right"
          >
            {/* Header */}
            <div className="px-4 pt-3 pb-2 border-b border-slate-100">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                Display Currency
              </p>
            </div>

            {/* Currency list */}
            <div
              className="py-1.5 overflow-y-auto"
              style={{ maxHeight: '272px' }}
            >
              {SUPPORTED_CURRENCIES.map((c) => {
                const isSelected = c.code === currency;
                return (
                  <button
                    key={c.code}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => { setCurrency(c.code as CurrencyCode); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-100 group',
                      isSelected ? 'bg-blue-50' : 'hover:bg-slate-50',
                    )}
                  >
                    {/* Color indicator */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CURRENCY_COLORS[c.code] ?? '#6b7280' }}
                    />

                    {/* Code + name */}
                    <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                      <span
                        className={cn(
                          'text-xs font-bold tabular-nums leading-none',
                          isSelected ? 'text-blue-700' : 'text-slate-900',
                        )}
                      >
                        {c.code}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate leading-none">
                        {c.name}
                      </span>
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <Check size={11} className="text-blue-600 flex-shrink-0" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
              <p className="text-[10px] text-slate-400">Applies to all summary totals</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
