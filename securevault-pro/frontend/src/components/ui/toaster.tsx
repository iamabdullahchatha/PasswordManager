import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToastManager } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import type { ToastType } from '../../hooks/useToast';

const CONFIGS: Record<ToastType, {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  wrapper: string;
  iconClass: string;
  iconBg: string;
}> = {
  success: { icon: CheckCircle2, wrapper: 'bg-white border-emerald-200 shadow-lg', iconClass: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  error:   { icon: XCircle,      wrapper: 'bg-white border-red-200 shadow-lg',     iconClass: 'text-red-600',     iconBg: 'bg-red-50' },
  warning: { icon: AlertTriangle,wrapper: 'bg-white border-amber-200 shadow-lg',   iconClass: 'text-amber-600',   iconBg: 'bg-amber-50' },
  info:    { icon: Info,         wrapper: 'bg-white border-blue-200 shadow-lg',    iconClass: 'text-blue-600',    iconBg: 'bg-blue-50' },
};

export function Toaster() {
  const { toasts, remove } = useToastManager();

  return (
    <div className="fixed top-4 right-4 z-toast flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const cfg = CONFIGS[t.type];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border',
                cfg.wrapper,
              )}
            >
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.iconBg)}>
                <Icon size={16} className={cfg.iconClass} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{t.title}</p>
                {t.description && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{t.description}</p>}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="flex-shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
