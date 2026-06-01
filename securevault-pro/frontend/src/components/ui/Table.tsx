import { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render?: (row: T, index: number) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  empty?: ReactNode;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  className?: string;
}

export function Table<T extends Record<string, unknown>>({
  columns, data, keyField, loading, empty, sortKey, sortOrder, onSort,
  rowClassName, onRowClick, stickyHeader, className,
}: TableProps<T>) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn('border-b border-slate-100 bg-slate-50/70', stickyHeader && 'sticky top-0 z-10')}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap',
                    col.sortable && 'cursor-pointer hover:text-slate-700 select-none',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                    col.width && `w-[${col.width}]`,
                    col.className,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortOrder === 'asc' ? <ChevronUp size={12} className="text-blue-600" /> : <ChevronDown size={12} className="text-blue-600" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-100 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {empty ?? (
                    <div className="py-12 text-center text-sm text-slate-400">No records found</div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <motion.tr
                  key={String(row[keyField])}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors group',
                    onRowClick && 'cursor-pointer',
                    'hover:bg-blue-50/40',
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3.5 text-sm text-slate-700',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.className,
                      )}
                    >
                      {col.render ? col.render(row, i) : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Pagination ──────────────────────────────────────────────────────────────── */
interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-sm">
      <p className="text-slate-500 text-xs">
        Showing <strong className="text-slate-700">{start}–{end}</strong> of <strong className="text-slate-700">{total}</strong> results
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Previous
        </button>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p: number;
          if (totalPages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= totalPages - 2) p = totalPages - 4 + i;
          else p = page - 2 + i;

          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                p === page
                  ? 'bg-blue-600 text-white shadow-blue-sm'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50',
              )}
            >
              {p}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
