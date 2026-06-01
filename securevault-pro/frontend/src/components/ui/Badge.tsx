import { cn } from '../../utils/cn';
import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'blue' | 'indigo' | 'purple' | 'cyan';
type BadgeSize = 'xs' | 'sm' | 'md';

const VARIANTS: Record<BadgeVariant, string> = {
  default:     'bg-blue-100 text-blue-700 border-blue-200',
  blue:        'bg-blue-100 text-blue-700 border-blue-200',
  secondary:   'bg-slate-100 text-slate-600 border-slate-200',
  success:     'bg-emerald-100 text-emerald-700 border-emerald-200',
  warning:     'bg-amber-100 text-amber-700 border-amber-200',
  destructive: 'bg-red-100 text-red-700 border-red-200',
  outline:     'bg-transparent border-slate-200 text-slate-600',
  indigo:      'bg-indigo-100 text-indigo-700 border-indigo-200',
  purple:      'bg-purple-100 text-purple-700 border-purple-200',
  cyan:        'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const SIZES: Record<BadgeSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] rounded-md',
  sm: 'px-2 py-0.5 text-xs rounded-md',
  md: 'px-2.5 py-1 text-xs rounded-lg',
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', dot, className }: BadgeProps) {
  const dotColor: Record<BadgeVariant, string> = {
    default: 'bg-blue-500', blue: 'bg-blue-500', secondary: 'bg-slate-400',
    success: 'bg-emerald-500', warning: 'bg-amber-500', destructive: 'bg-red-500',
    outline: 'bg-slate-400', indigo: 'bg-indigo-500', purple: 'bg-purple-500', cyan: 'bg-cyan-500',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 font-medium border',
      VARIANTS[variant],
      SIZES[size],
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColor[variant])} />}
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, BadgeVariant> = { SUPER_ADMIN: 'destructive', ADMIN: 'warning', USER: 'default' };
  return <Badge variant={map[role] ?? 'secondary'}>{role.replace('_', ' ')}</Badge>;
}

export function StatusBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'secondary'} dot>{active ? 'Active' : 'Inactive'}</Badge>;
}
