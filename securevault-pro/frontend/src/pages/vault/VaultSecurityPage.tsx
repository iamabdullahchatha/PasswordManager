import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw,
  Copy, Clock, Wifi, WifiOff, Key, ArrowRight,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { vaultService } from '../../services/vault.service';
import { getErrorMessage } from '../../services/api';
import { toast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import type { SecurityReport, SecurityReportEntry, ImportanceLevel } from '../../types';
import { ProviderIcon, PROVIDER_LABELS } from '../../components/vault/ProviderIcon';

const IMP_CFG: Record<ImportanceLevel, 'destructive' | 'warning' | 'default' | 'secondary'> = {
  CRITICAL: 'destructive', HIGH: 'warning', MEDIUM: 'default', LOW: 'secondary',
};

/* ── Security score ring ─────────────────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
  const textColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#F1F5F9" strokeWidth="10" />
          <circle
            cx="60" cy="60" r={radius} fill="none"
            stroke={color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-extrabold', textColor)}>{score}</span>
          <span className="text-xs text-slate-500 font-medium">/ 100</span>
        </div>
      </div>
      <p className={cn('text-base font-bold mt-2', textColor)}>{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">Security Score</p>
    </div>
  );
}

/* ── Issue section ───────────────────────────────────────────────────── */
function IssueSection({
  title, icon: Icon, color, entries, emptyMsg,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  color: string;
  entries: SecurityReportEntry[];
  emptyMsg: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2.5 py-4 px-5">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={14} className="text-emerald-600" />
        </div>
        <p className="text-sm text-emerald-700 font-medium">{emptyMsg}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-50">
      {entries.map((e) => (
        <Link key={e.id} to={`/vault/${e.id}`}>
          <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <ProviderIcon provider={e.provider} size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{e.title}</p>
              <p className="text-xs text-slate-500 truncate">{e.emailAddress}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant={IMP_CFG[e.importanceLevel]} size="xs">
                {e.importanceLevel.charAt(0) + e.importanceLevel.slice(1).toLowerCase()}
              </Badge>
              <ArrowRight size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function VaultSecurityPage() {
  const [report, setReport] = useState<SecurityReport | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await vaultService.getSecurityReport();
      setReport(res.data ?? null);
    } catch (err) { toast(getErrorMessage(err), 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) return <PageLoader text="Analysing vault security…" />;

  if (!report) return (
    <div className="text-center py-20">
      <ShieldAlert size={40} className="text-slate-300 mx-auto mb-4" />
      <p className="text-slate-500">Could not load security report</p>
      <Button variant="outline" className="mt-4" onClick={fetchReport}>Retry</Button>
    </div>
  );

  const ISSUES = [
    {
      key: 'weak',
      title: 'Weak Passwords',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200',
      headerColor: 'bg-red-50 border-b border-red-100',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      count: report.issues.weak,
      entries: report.entries.weak,
      emptyMsg: 'No weak passwords detected',
      desc: 'These passwords score below 40/100 and should be changed immediately.',
    },
    {
      key: 'reused',
      title: 'Reused Passwords',
      icon: Copy,
      color: 'bg-orange-50 border-orange-200',
      headerColor: 'bg-orange-50 border-b border-orange-100',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      count: report.issues.reused,
      entries: report.entries.reused,
      emptyMsg: 'No reused passwords found',
      desc: 'The same password used on multiple accounts significantly increases risk.',
    },
    {
      key: 'old',
      title: 'Old Passwords (90+ days)',
      icon: RefreshCw,
      color: 'bg-amber-50 border-amber-200',
      headerColor: 'bg-amber-50 border-b border-amber-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      count: report.issues.old,
      entries: report.entries.old,
      emptyMsg: 'All passwords changed recently',
      desc: 'Passwords older than 90 days should be rotated for better security.',
    },
    {
      key: 'expiring',
      title: 'Expiring Soon',
      icon: Clock,
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'bg-blue-50 border-b border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      count: report.issues.expiring,
      entries: report.entries.expiring,
      emptyMsg: 'No upcoming password reminders',
      desc: 'Passwords with upcoming change reminders within 30 days.',
    },
    {
      key: 'no2fa',
      title: 'No Two-Factor Auth',
      icon: WifiOff,
      color: 'bg-purple-50 border-purple-200',
      headerColor: 'bg-purple-50 border-b border-purple-100',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      count: report.issues.no2fa,
      entries: report.entries.no2fa,
      emptyMsg: 'All accounts have 2FA enabled',
      desc: 'Enable 2FA on these accounts for an additional layer of security.',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vault Security Report"
        description="Comprehensive analysis of your password health"
        icon={ShieldAlert}
        action={
          <Button variant="outline" size="sm" leftIcon={RefreshCw} onClick={fetchReport} loading={loading}>
            Refresh
          </Button>
        }
      />

      {/* ── Score + Summary ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <ScoreRing score={report.score} />

          <div className="flex-1 w-full">
            <p className="text-sm font-semibold text-slate-900 mb-4">Issue Summary</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ISSUES.map((issue) => (
                <div key={issue.key} className={cn('rounded-xl border p-3.5 text-center', issue.color)}>
                  <p className="text-2xl font-extrabold text-slate-900">{issue.count}</p>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium leading-tight">{issue.title}</p>
                </div>
              ))}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3.5 text-center">
                <p className="text-2xl font-extrabold text-emerald-700">{report.total}</p>
                <p className="text-xs text-emerald-600 mt-0.5 font-medium">Total Entries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical without 2FA */}
      {report.criticalWithoutTwoFA.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 bg-red-100/60 border-b border-red-200 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-red-200 flex items-center justify-center">
              <AlertTriangle size={14} className="text-red-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800">Critical Accounts Without 2FA ({report.criticalWithoutTwoFA.length})</p>
              <p className="text-xs text-red-600 mt-0.5">These need immediate attention</p>
            </div>
          </div>
          <IssueSection title="" icon={AlertTriangle} color="" entries={report.criticalWithoutTwoFA} emptyMsg="" />
        </div>
      )}

      {/* Issue sections */}
      {ISSUES.map((issue) => (
        <motion.div
          key={issue.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden"
        >
          <div className={cn('px-5 py-4 flex items-center gap-3', issue.headerColor)}>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', issue.iconBg)}>
              <issue.icon size={15} className={issue.iconColor} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{issue.title}</p>
                {issue.count > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">{issue.count}</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{issue.desc}</p>
            </div>
          </div>
          <IssueSection title={issue.title} icon={issue.icon} color={issue.color} entries={issue.entries} emptyMsg={issue.emptyMsg} />
        </motion.div>
      ))}

      {/* Export/Import vault */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Key size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Backup Your Vault</p>
            <p className="text-xs text-slate-500">Export an encrypted backup of all vault entries</p>
          </div>
        </div>
        <Link to="/vault/export">
          <Button variant="outline" size="sm">Export Encrypted Backup</Button>
        </Link>
      </div>
    </div>
  );
}
