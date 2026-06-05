import {
  useRef, useState, useEffect, useLayoutEffect, useCallback, useMemo, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

/* ──────────────────────────────────────────────────────────────────────────
 * SelectMenu — a premium, fully custom dropdown that replaces native <select>
 * across the app. Controlled (value / onChange). Portal-rendered so it never
 * clips inside cards, modals, or overflow containers. Keyboard-accessible.
 * ────────────────────────────────────────────────────────────────────────── */

export interface SelectOption {
  value: string;
  label: string;
  /** Optional secondary line shown under the label */
  description?: string;
  /** Optional colour dot indicator */
  color?: string;
  /** Optional leading icon node */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options?: SelectOption[];
  groups?: SelectGroup[];
  placeholder?: string;
  /** Field label rendered above the trigger */
  label?: ReactNode;
  /** Error message; also paints the trigger red */
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  /** Force the search box on/off. Defaults to auto (on when > 8 options). */
  searchable?: boolean;
  size?: 'sm' | 'md';
  /** Wrapper element class */
  className?: string;
  /** Trigger button class */
  buttonClassName?: string;
  /** Leading icon inside the trigger */
  leadingIcon?: ReactNode;
  /** Accessible label when no visible `label` is provided */
  ariaLabel?: string;
  name?: string;
  id?: string;
}

const DROPDOWN_V = {
  initial: { opacity: 0, scale: 0.97, y: -6 },
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, stiffness: 460, damping: 32 },
  },
  exit: { opacity: 0, scale: 0.97, y: -6, transition: { duration: 0.1, ease: 'easeIn' as const } },
};

export function SelectMenu({
  value, onChange, options, groups, placeholder = 'Select…',
  label, error, hint, required, disabled, searchable,
  size = 'md', className, buttonClassName, leadingIcon, ariaLabel, name, id,
}: SelectMenuProps) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [active, setActive]   = useState(0);
  const [rect, setRect]       = useState<{ top: number; left: number; width: number; below: boolean } | null>(null);

  const wrapRef   = useRef<HTMLDivElement>(null);
  const btnRef    = useRef<HTMLButtonElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* Flatten groups/options into a single list for lookup + keyboard nav. */
  const allOptions = useMemo<SelectOption[]>(
    () => (groups ? groups.flatMap((g) => g.options) : options ?? []),
    [groups, options],
  );

  const selected = allOptions.find((o) => o.value === value) ?? null;

  const showSearch = searchable ?? allOptions.length > 8;

  /* Filtered structure that respects grouping. */
  const filteredGroups = useMemo<SelectGroup[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (o: SelectOption) =>
      !q || o.label.toLowerCase().includes(q) || o.description?.toLowerCase().includes(q);

    if (groups) {
      return groups
        .map((g) => ({ label: g.label, options: g.options.filter(match) }))
        .filter((g) => g.options.length > 0);
    }
    return [{ label: '', options: (options ?? []).filter(match) }];
  }, [groups, options, query]);

  const flatFiltered = useMemo(() => filteredGroups.flatMap((g) => g.options), [filteredGroups]);

  /* ── Positioning (portal, fixed to viewport) ──────────────────────────── */
  const computePosition = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const below = spaceBelow > 280 || spaceBelow > r.top;
    setRect({
      top: below ? r.bottom + 6 : r.top - 6,
      left: r.left,
      width: r.width,
      below,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computePosition();
    const onScroll = () => computePosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, computePosition]);

  /* ── Open/close side-effects ──────────────────────────────────────────── */
  useEffect(() => {
    if (!open) { setQuery(''); return; }
    // Highlight the currently-selected option when opening.
    const idx = flatFiltered.findIndex((o) => o.value === value);
    setActive(idx >= 0 ? idx : 0);
    const t = setTimeout(() => searchRef.current?.focus(), 20);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Keep active index in range as the filter changes. */
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, flatFiltered.length - 1)));
  }, [flatFiltered.length]);

  /* Click-outside (accounts for the portalled panel). */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const choose = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'Escape':    e.preventDefault(); setOpen(false); btnRef.current?.focus(); break;
      case 'ArrowDown': e.preventDefault(); setActive((a) => Math.min(a + 1, flatFiltered.length - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); break;
      case 'Home':      e.preventDefault(); setActive(0); break;
      case 'End':       e.preventDefault(); setActive(flatFiltered.length - 1); break;
      case 'Enter':
        e.preventDefault();
        if (flatFiltered[active]) choose(flatFiltered[active]);
        break;
    }
  };

  /* Scroll the active option into view. */
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const h = size === 'sm' ? 'h-9' : 'h-[42px]';

  /* Render one option row. `idx` is the flat index for keyboard nav. */
  const renderOption = (opt: SelectOption, idx: number) => {
    const isSelected = opt.value === value;
    const isActive   = idx === active;
    return (
      <button
        key={opt.value || `opt-${idx}`}
        type="button"
        role="option"
        aria-selected={isSelected}
        data-idx={idx}
        disabled={opt.disabled}
        onMouseEnter={() => setActive(idx)}
        onClick={() => choose(opt)}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-75 rounded-lg',
          opt.disabled && 'opacity-40 cursor-not-allowed',
          isActive && !opt.disabled ? 'bg-blue-50' : 'hover:bg-slate-50',
        )}
      >
        {opt.color !== undefined && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
        )}
        {opt.icon && <span className="flex-shrink-0 flex items-center text-slate-500">{opt.icon}</span>}
        <span className="flex-1 min-w-0">
          <span className={cn('block text-sm truncate', isSelected ? 'font-semibold text-blue-700' : 'text-slate-700')}>
            {opt.label}
          </span>
          {opt.description && (
            <span className="block text-[11px] text-slate-400 truncate leading-tight">{opt.description}</span>
          )}
        </span>
        {isSelected && <Check size={14} className="text-blue-600 flex-shrink-0" strokeWidth={2.5} />}
      </button>
    );
  };

  // Running counter so each option gets a stable flat index across groups.
  let runningIdx = -1;

  return (
    <div className={cn('space-y-1.5', className)} ref={wrapRef}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700" id={id ? `${id}-label` : undefined}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <button
        ref={btnRef}
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg border bg-white text-sm transition-all duration-150 select-none',
          'px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
          h,
          disabled && 'cursor-not-allowed bg-slate-50 text-slate-400',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : open
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-slate-200 hover:border-slate-300',
          buttonClassName,
        )}
      >
        {leadingIcon && <span className="flex-shrink-0 flex items-center text-slate-400">{leadingIcon}</span>}
        {selected?.color !== undefined && selected && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
        )}
        <span className={cn('flex-1 min-w-0 text-left truncate', selected ? 'text-slate-900' : 'text-slate-400')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={cn('flex-shrink-0 transition-transform duration-200 text-slate-400', open && 'rotate-180 text-blue-500')}
        />
      </button>

      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </p>
      )}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && rect && (
            <motion.div
              ref={panelRef}
              role="listbox"
              aria-label={ariaLabel ?? (typeof label === 'string' ? label : undefined)}
              variants={DROPDOWN_V}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{
                position: 'fixed',
                top: rect.below ? rect.top : undefined,
                bottom: rect.below ? undefined : window.innerHeight - rect.top,
                left: rect.left,
                width: rect.width,
                zIndex: 9999,
                transformOrigin: rect.below ? 'top' : 'bottom',
              }}
              className="bg-white rounded-xl border border-slate-200/80 shadow-modal overflow-hidden"
            >
              {showSearch && (
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Search…"
                      className="w-full h-8 pl-7 pr-2 rounded-lg bg-slate-50 border border-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-300 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="p-1.5 overflow-y-auto" style={{ maxHeight: 264 }}>
                {flatFiltered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-slate-400">No matches</p>
                ) : (
                  filteredGroups.map((g, gi) => (
                    <div key={g.label || `g-${gi}`}>
                      {g.label && (
                        <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {g.label}
                        </p>
                      )}
                      {g.options.map((opt) => {
                        runningIdx += 1;
                        return renderOption(opt, runningIdx);
                      })}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
