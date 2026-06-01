import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  accent?: string;
}

const PADDING = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

export function Card({ children, className, hover, padding = 'md', onClick, accent }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-card rounded-2xl border border-slate-200/80 overflow-hidden',
        'shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]',
        'dark:shadow-[0_2px_12px_rgba(0,0,0,0.4),0_1px_3px_rgba(0,0,0,0.3)]',
        hover && 'transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.09),0_8px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 cursor-pointer',
        PADDING[padding],
        className,
      )}
    >
      {/* Subtle shimmer line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent pointer-events-none" />
      {/* Optional left accent bar */}
      {accent && (
        <div className={cn('absolute left-0 top-4 bottom-4 w-0.5 rounded-full', accent)} />
      )}
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  iconColor?: string;
}

export function CardHeader({ title, description, action, icon: Icon, iconColor }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', iconColor ?? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white')}>
            <Icon size={17} />
          </div>
        )}
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}

export function CardDivider({ className }: { className?: string }) {
  return <div className={cn('border-t border-slate-100 my-4', className)} />;
}

export function CardSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-5 border-b border-slate-100 last:border-0', className)}>{children}</div>;
}
