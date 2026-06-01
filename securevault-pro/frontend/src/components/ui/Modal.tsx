import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const SIZES: Record<string, string> = {
  xs: 'max-w-sm',
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
  '2xl': 'max-w-3xl',
  full: 'max-w-5xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: keyof typeof SIZES;
  hideClose?: boolean;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  iconColor?: string;
}

export function Modal({ open, onClose, title, description, children, size = 'md', hideClose, icon: Icon, iconColor }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={cn(
              'relative w-full bg-white rounded-2xl shadow-modal z-10',
              'border border-slate-200/60',
              SIZES[size],
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {Icon && (
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconColor ?? 'bg-blue-100')}>
                      <Icon size={17} className={iconColor ? 'text-white' : 'text-blue-600'} />
                    </div>
                  )}
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                    {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
                  </div>
                </div>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 ml-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className={cn('', title ? 'p-6' : 'p-6')}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── Confirm Dialog ─────────────────────────────────────────────────────────── */
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'destructive' | 'primary';
  loading?: boolean;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = 'Confirm',
  variant = 'destructive', loading, icon: Icon,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="xs">
      <div className="text-center">
        {Icon && (
          <div className={cn(
            'w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center',
            variant === 'destructive' ? 'bg-red-100' : 'bg-blue-100',
          )}>
            <Icon size={22} className={variant === 'destructive' ? 'text-red-600' : 'text-blue-600'} />
          </div>
        )}
        <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-9 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 h-9 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50',
              variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700',
            )}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
