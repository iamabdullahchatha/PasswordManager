import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const CONFIGS: Record<AlertVariant, {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  iconClass: string;
  wrapper: string;
  title: string;
}> = {
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    wrapper: 'bg-blue-50 border-blue-200 text-blue-800',
    title: 'text-blue-800',
  },
  success: {
    icon: CheckCircle,
    iconClass: 'text-emerald-500',
    wrapper: 'bg-emerald-50 border-emerald-200',
    title: 'text-emerald-800',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    wrapper: 'bg-amber-50 border-amber-200',
    title: 'text-amber-800',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-500',
    wrapper: 'bg-red-50 border-red-200',
    title: 'text-red-800',
  },
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  icon?: boolean;
}

export function Alert({ variant = 'info', title, children, onDismiss, icon = true }: AlertProps) {
  const config = CONFIGS[variant];
  const Icon = config.icon;

  return (
    <div className={cn('flex gap-3 p-4 rounded-xl border', config.wrapper)}>
      {icon && <Icon size={16} className={cn('flex-shrink-0 mt-0.5', config.iconClass)} />}
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold mb-0.5', config.title)}>{title}</p>}
        <div className="text-sm opacity-90 leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
