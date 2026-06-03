import { Globe } from 'lucide-react';
import { useCurrencyStore, SUPPORTED_CURRENCIES, type CurrencyCode } from '../../store/currencyStore';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrencyStore();

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-medium transition-all pointer-events-none select-none">
        <Globe size={13} className="text-slate-400 flex-shrink-0" />
        <span className="font-semibold">{currency}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-slate-400 flex-shrink-0" fill="none">
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        aria-label="Select display currency"
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
      >
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} — {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
