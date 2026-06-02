import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell, AlertTriangle, Info, XCircle, CheckCircle2,
  ArrowRight, RefreshCw, ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { useNotifications, type AppNotification } from '../hooks/useNotifications';
import { cn } from '../utils/cn';

const TYPE_CONFIG: Record<AppNotification['type'], {
  icon: React.ComponentType<any>;
  iconClass: string;
  bg: string;
  border: string;
  badge: 'warning' | 'destructive' | 'secondary' | 'default';
  label: string;
}> = {
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    badge: 'warning',
    label: 'Warning',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-100',
    badge: 'destructive',
    label: 'Alert',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    badge: 'default',
    label: 'Info',
  },
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    badge: 'secondary',
    label: 'Success',
  },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, loading, refetch } = useNotifications();

  const errors   = notifications.filter((n) => n.type === 'error');
  const warnings = notifications.filter((n) => n.type === 'warning');
  const infos    = notifications.filter((n) => n.type === 'info');
  const successes = notifications.filter((n) => n.type === 'success');

  const grouped = [
    { label: 'Alerts',   items: errors },
    { label: 'Warnings', items: warnings },
    { label: 'Info',     items: infos },
    { label: 'Status',   items: successes },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description="Security and system alerts for your account"
        icon={Bell}
        badge={
          notifications.length > 0 ? (
            <Badge variant="secondary" size="sm">{notifications.length} active</Badge>
          ) : undefined
        }
        action={
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw size={13} />
            Refresh
          </Button>
        }
      />

      {loading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="All clear"
          description="No active notifications — your account is in good shape"
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.items.map((n, i) => {
                  const cfg = TYPE_CONFIG[n.type];
                  const Icon = cfg.icon;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md',
                        cfg.border,
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                        <Icon size={18} className={cfg.iconClass} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                          <Badge variant={cfg.badge} size="sm">{cfg.label}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">{n.body}</p>
                      </div>
                      {n.link && (
                        <button
                          onClick={() => navigate(n.link!)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 flex-shrink-0 mt-0.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          View
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
