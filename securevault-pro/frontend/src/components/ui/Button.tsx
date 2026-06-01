import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'warning' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
  loading?: boolean;
  leftIcon?: React.ComponentType<{ size?: number | string; className?: string }>;
  rightIcon?: React.ComponentType<{ size?: number | string; className?: string }>;
  fullWidth?: boolean;
}

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_2px_10px_rgba(37,99,235,0.35)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.45)] hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 disabled:shadow-none',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 border border-slate-200',
  outline:
    'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100',
  ghost:
    'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
  destructive:
    'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm hover:from-red-500 hover:to-rose-500 hover:shadow-[0_4px_12px_rgba(220,38,38,0.35)]',
  success:
    'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-500 hover:to-teal-500',
  warning:
    'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:from-amber-400 hover:to-orange-400',
  link:
    'text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline p-0 h-auto',
};

const SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  xs:      'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  sm:      'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md:      'h-9 px-4 text-sm gap-2 rounded-lg',
  lg:      'h-11 px-5 text-base gap-2 rounded-lg',
  icon:    'h-9 w-9 rounded-lg',
  'icon-sm': 'h-7 w-7 rounded-md',
  'icon-lg': 'h-11 w-11 rounded-lg',
};

const ICON_SIZES: Record<NonNullable<ButtonProps['size']>, number> = {
  xs: 12, sm: 13, md: 15, lg: 16, icon: 15, 'icon-sm': 13, 'icon-lg': 17,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon: L, rightIcon: R, fullWidth, children, disabled, className, ...props }, ref) => {
    const iconSize = ICON_SIZES[size];

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'select-none whitespace-nowrap',
          VARIANTS[variant],
          SIZES[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={iconSize} className="animate-spin flex-shrink-0" />
        ) : L ? (
          <L size={iconSize} className="flex-shrink-0" />
        ) : null}
        {children}
        {!loading && R && <R size={iconSize} className="flex-shrink-0" />}
      </button>
    );
  },
);

Button.displayName = 'Button';
