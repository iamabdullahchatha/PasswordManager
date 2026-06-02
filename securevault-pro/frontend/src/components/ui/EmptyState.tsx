import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, size = 'md', className }: EmptyStateProps) {
  const sizes = {
    sm: { container: 'py-10', iconSize: 20, iconWrapper: 'w-12 h-12 rounded-xl' },
    md: { container: 'py-16', iconSize: 26, iconWrapper: 'w-16 h-16 rounded-2xl' },
    lg: { container: 'py-24', iconSize: 32, iconWrapper: 'w-20 h-20 rounded-3xl' },
  };
  const s = sizes[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('flex flex-col items-center justify-center text-center', s.container, className)}
    >
      {/* Icon container */}
      <div className="relative mb-5">
        {/* Glow ring */}
        <div className={cn(s.iconWrapper, 'absolute inset-0 -z-10 mx-auto scale-125')}
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
        {/* Icon box */}
        <div className={cn(
          s.iconWrapper,
          'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/80 flex items-center justify-center mx-auto',
          'shadow-[0_4px_16px_rgba(37,99,235,0.12)]',
        )}>
          <Icon size={s.iconSize} className="text-blue-400" />
        </div>
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-1">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An error occurred while loading this content.',
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 flex items-center justify-center mb-4 shadow-[0_4px_16px_rgba(239,68,68,0.12)]">
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-red-500">
          <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-5">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-2 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 border-r-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500">{text}</p>
    </div>
  );
}
