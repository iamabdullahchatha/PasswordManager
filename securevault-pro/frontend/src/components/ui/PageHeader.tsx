import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: string[];
  badge?: ReactNode;
  className?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  gradient?: boolean;
}

export function PageHeader({
  title, description, action, breadcrumb, badge, className, icon: Icon, gradient,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn('mb-6', className)}
    >
      {breadcrumb && breadcrumb.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2.5">
          {breadcrumb.map((part, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300">/</span>}
              <span className={cn(
                'text-xs font-medium',
                i === breadcrumb.length - 1
                  ? 'text-slate-500'
                  : 'text-slate-400',
              )}>
                {part}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {Icon && (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.35)]">
              <Icon size={20} className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className={cn(
                'text-2xl font-extrabold leading-none tracking-tight',
                gradient
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
                  : 'text-slate-900 dark:text-white',
              )}>
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p className="text-sm text-slate-500 mt-1.5 leading-snug">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="flex items-center gap-2 flex-shrink-0">{action}</div>
        )}
      </div>
    </motion.div>
  );
}

export function SectionHeader({
  title, description, action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
