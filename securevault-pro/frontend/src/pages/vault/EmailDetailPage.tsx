import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit, Trash2, Star, Globe, Shield, Clock, Eye, EyeOff,
  Key, ExternalLink, Lock, Phone, Smartphone, HelpCircle,
  Hash, Activity, CheckCircle2, XCircle, Archive, ArchiveX,
  RefreshCw, AlertTriangle, Copy,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CopyButton } from '../../components/ui/CopyButton';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { vaultService } from '../../services/vault.service';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { formatDate, formatRelativeTime } from '../../utils/format';
import { cn } from '../../utils/cn';
import type { VaultEntry, VaultActivity, ImportanceLevel } from '../../types';
import { ProviderIcon, PROVIDER_LABELS } from '../../components/vault/ProviderIcon';

/* ── Strength config ───────────────────────────────────────────────────── */
const S_CFG = [
  { max: 20,  bar: 'bg-red-500',     text: 'text-red-600',     label: 'Very Weak'  },
  { max: 40,  bar: 'bg-orange-400',  text: 'text-orange-600',  label: 'Weak'       },
  { max: 60,  bar: 'bg-yellow-400',  text: 'text-yellow-600',  label: 'Fair'       },
  { max: 80,  bar: 'bg-blue-500',    text: 'text-blue-600',    label: 'Strong'     },
  { max: 101, bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Very Strong'},
];

const IMP_CFG: Record<ImportanceLevel, { variant: 'destructive' | 'warning' | 'default' | 'secondary'; label: string }> = {
  CRITICAL: { variant: 'destructive', label: 'Critical' },
  HIGH:     { variant: 'warning',     label: 'High'     },
  MEDIUM:   { variant: 'default',     label: 'Medium'   },
  LOW:      { variant: 'secondary',   label: 'Low'      },
};

const TABS = ['Overview','Credentials','Recovery','Security','Notes','Activity'] as const;
type Tab = typeof TABS[number];

/* ── Helper components ─────────────────────────────────────────────────── */
function InfoRow({ label, value, mono = false, copy }: { label: string; value: string | null | undefined; mono?: boolean; copy?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between py-3 border-b border-slate-50 last:border-0 gap-4">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide flex-shrink-0 w-32">{label}</p>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <p className={cn('text-sm text-slate-800 break-all flex-1', mono && 'font-mono')}>{value}</p>
        {copy && <CopyButton value={value} size="sm" />}
      </div>
    </div>
  );
}

function RevealField({
  label, hasValue, onReveal, revealed, loading,
}: {
  label: string;
  hasValue: boolean;
  onReveal: () => void;
  revealed: string | null;
  loading: boolean;
}) {
  const [show, setShow] = useState(false);
  if (!hasValue) return null;
  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">{label}</p>
      {revealed ? (
        <div className="flex items-start gap-2">
          <pre className={cn('text-xs flex-1 whitespace-pre-wrap font-mono', !show && 'blur-sm select-none')}>{revealed}</pre>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setShow((p) => !p)} className="p-1 text-slate-400 hover:text-slate-600">
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <CopyButton value={revealed} size="sm" />
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" leftIcon={Eye} onClick={onReveal} loading={loading}>
          Reveal {label}
        </Button>
      )}
    </div>
  );
}

/* ── Action log colours ────────────────────────────────────────────────── */
const LOG_COLORS: Record<string, string> = {
  VAULT_CREATE: 'bg-emerald-50 text-emerald-700',
  VAULT_UPDATE: 'bg-blue-50 text-blue-700',
  VAULT_DELETE: 'bg-red-50 text-red-700',
  VAULT_ARCHIVE: 'bg-slate-100 text-slate-600',
  PASSWORD_VIEW: 'bg-amber-50 text-amber-700',
  PASSWORD_COPY: 'bg-amber-50 text-amber-700',
  BACKUP_CODES_VIEW: 'bg-purple-50 text-purple-700',
  APP_PASSWORDS_VIEW: 'bg-purple-50 text-purple-700',
  SECURITY_QUESTIONS_VIEW: 'bg-purple-50 text-purple-700',
};
const LOG_LABELS: Record<string, string> = {
  VAULT_CREATE: 'Entry created',        VAULT_UPDATE: 'Entry updated',
  VAULT_DELETE: 'Entry deleted',        VAULT_ARCHIVE: 'Archived',
  PASSWORD_VIEW: 'Password revealed',   PASSWORD_COPY: 'Password copied',
  BACKUP_CODES_VIEW: 'Backup codes revealed',
  APP_PASSWORDS_VIEW: 'App passwords revealed',
  SECURITY_QUESTIONS_VIEW: 'Security questions revealed',
};

export default function EmailDetailPage() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const [tab, setTab]   = useState<Tab>('Overview');
  const [entry, setEntry]           = useState<VaultEntry | null>(null);
  const [activity, setActivity]     = useState<VaultActivity[]>([]);
  const [loading, setLoading]       = useState(true);

  // Reveal modal
  const [revealModal, setRevealModal]   = useState<{ field: string; label: string } | null>(null);
  const [masterPwd, setMasterPwd]       = useState('');
  const [showMasterPwd, setShowMasterPwd] = useState(false);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError]   = useState('');

  // Revealed values
  const [revealedPwd, setRevealedPwd]   = useState<string | null>(null);
  const [showPwd, setShowPwd]           = useState(false);
  const [revealedCodes, setRevealedCodes] = useState<string | null>(null);
  const [revealedAppPw, setRevealedAppPw] = useState<string | null>(null);
  const [revealedSQ, setRevealedSQ]     = useState<string | null>(null);
  const [revealedNotes, setRevealedNotes]= useState<string | null>(null);

  const [deleteModal,     setDeleteModal]     = useState(false);
  const [deleteMasterPwd, setDeleteMasterPwd] = useState('');
  const [showDeletePwd,   setShowDeletePwd]   = useState(false);
  const [deleteError,     setDeleteError]     = useState('');
  const [deleteLoading,   setDeleteLoading]   = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      vaultService.getById(id),
      vaultService.getEntryActivity(id),
    ]).then(([eRes, aRes]) => {
      setEntry(eRes.data ?? null);
      setActivity(aRes.data ?? []);
    }).finally(() => setLoading(false));
  }, [id]);

  const openReveal = (field: string, label: string) => {
    setRevealModal({ field, label });
    setMasterPwd(''); setRevealError(''); setShowMasterPwd(false);
  };

  const doReveal = async () => {
    if (!id || !masterPwd.trim() || !revealModal) { setRevealError('Enter your master password'); return; }
    setRevealLoading(true); setRevealError('');
    try {
      const res = await vaultService.reveal(id, masterPwd, revealModal.field as any);
      const value = res.data?.value ?? null;
      switch (revealModal.field) {
        case 'password':          setRevealedPwd(value);   break;
        case 'backupCodes':       setRevealedCodes(value); break;
        case 'appPasswords':      setRevealedAppPw(value); break;
        case 'securityQuestions': setRevealedSQ(value);    break;
        case 'notes':             setRevealedNotes(value); break;
      }
      setRevealModal(null);
    } catch (err) { setRevealError(getErrorMessage(err)); }
    finally { setRevealLoading(false); }
  };

  const closeDeleteModal = () => {
    setDeleteModal(false);
    setDeleteMasterPwd('');
    setShowDeletePwd(false);
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!deleteMasterPwd.trim()) { setDeleteError('Enter your master password'); return; }
    setDeleteLoading(true); setDeleteError('');
    try {
      await vaultService.delete(id, deleteMasterPwd);
      toast('Entry deleted', 'success');
      navigate('/vault');
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally { setDeleteLoading(false); }
  };

  const handleArchive = async () => {
    if (!id || !entry) return;
    try {
      const res = await vaultService.toggleArchive(id);
      if (res.data) {
        setEntry((p) => p ? { ...p, archivedAt: res.data!.archivedAt } : p);
        toast(entry.archivedAt ? 'Entry restored' : 'Entry archived', 'success');
      }
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  if (loading) return <PageLoader />;
  if (!entry) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Shield size={40} className="text-slate-200 mb-4" />
      <p className="text-lg font-semibold text-slate-800">Entry not found</p>
      <Link to="/vault"><Button variant="outline" className="mt-5">Back to Vault</Button></Link>
    </div>
  );

  const impCfg    = IMP_CFG[entry.importanceLevel];
  const sCfg      = S_CFG.find((c) => (entry.passwordStrength ?? 100) < c.max) ?? S_CFG[4];
  const filled    = Math.ceil(((entry.passwordStrength ?? 0) / 100) * 5);

  /* ── Tab content renderers ─────────────────────────────────────────── */
  const renderOverview = () => (
    <div className="space-y-5">
      {/* Platform hero */}
      <div className="flex items-start gap-5 p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-100">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-blue-sm flex-shrink-0">
          <ProviderIcon provider={entry.provider} size={28} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-900">{entry.title}</h2>
          <p className="text-sm text-slate-500">{PROVIDER_LABELS[entry.provider]}</p>
          {entry.platformUrl && (
            <a href={entry.platformUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-0.5">
              <Globe size={13} />{entry.platformUrl}<ExternalLink size={10} />
            </a>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant={impCfg.variant}>{impCfg.label}</Badge>
            {entry.twoFactorEnabled && <Badge variant="success" dot>2FA On</Badge>}
            {entry.isFavorite && <Badge variant="blue"><Star size={10} className="mr-0.5" />Favorite</Badge>}
            {entry.archivedAt && <Badge variant="secondary">Archived</Badge>}
            {entry.tags.map((t) => <Badge key={t.name} variant="outline" size="xs">{t.name}</Badge>)}
          </div>
        </div>
      </div>

      {/* Password health */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Password Health</p>
        <div className="flex items-center gap-4">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className={cn('h-2 w-10 rounded-full', i <= filled ? sCfg.bar : 'bg-slate-100')} />
            ))}
          </div>
          <span className={cn('text-sm font-semibold', sCfg.text)}>{sCfg.label}</span>
          {entry.passwordStrength !== null && (
            <span className="text-xs text-slate-400 ml-auto">{entry.passwordStrength}/100</span>
          )}
        </div>
        {entry.lastPasswordChangedAt && (
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <RefreshCw size={10} /> Last changed {formatRelativeTime(entry.lastPasswordChangedAt)}
          </p>
        )}
        {entry.nextPasswordReminderAt && (
          <p className={cn('text-xs mt-1 flex items-center gap-1', new Date(entry.nextPasswordReminderAt) <= new Date() ? 'text-red-500' : 'text-slate-400')}>
            <Clock size={10} /> Reminder: {formatDate(entry.nextPasswordReminderAt)}
          </p>
        )}
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Created',      value: formatDate(entry.createdAt)  },
          { label: 'Updated',      value: formatDate(entry.updatedAt)  },
          { label: 'Last Used',    value: entry.lastAccessedAt ? formatRelativeTime(entry.lastAccessedAt) : 'Never' },
          { label: 'Category',     value: entry.category || '—'        },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3.5">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCredentials = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
          <Lock size={14} className="text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Credentials</p>
        <span className="ml-auto text-xs text-slate-400">AES-256-GCM encrypted</span>
      </div>
      <div className="p-5 space-y-1">
        <InfoRow label="Email"    value={entry.emailAddress}  mono copy />
        <InfoRow label="Username" value={entry.username}      mono copy />
        {/* Password reveal */}
        <div className="py-3 border-b border-slate-50">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Password</p>
          {revealedPwd !== null ? (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-mono flex-1 break-all', !showPwd && 'blur-sm select-none')}>{revealedPwd}</p>
                <button onClick={() => setShowPwd((p) => !p)} className="p-1 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <CopyButton value={revealedPwd} size="sm" onCopy={() => id && vaultService.logCopy(id)} />
              </div>
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Clock size={10} /> Clipboard clears in 30 seconds
              </p>
            </div>
          ) : (
            <Button variant="primary" size="sm" leftIcon={Eye} onClick={() => openReveal('password','Password')}>
              Reveal Password
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderRecovery = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Shield size={14} className="text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Recovery Information</p>
      </div>
      <div className="p-5 space-y-1">
        <InfoRow label="Recovery Email" value={entry.recoveryEmail} copy />
        <InfoRow label="Recovery Phone" value={entry.recoveryPhone} copy />
        {!entry.recoveryEmail && !entry.recoveryPhone && (
          <div className="py-6 text-center">
            <Shield size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No recovery information stored</p>
            <Link to={`/vault/${entry.id}/edit`}>
              <Button variant="outline" size="sm" className="mt-3">Add Recovery Info</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      {/* 2FA status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', entry.twoFactorEnabled ? 'bg-emerald-100' : 'bg-slate-100')}>
            <Smartphone size={16} className={entry.twoFactorEnabled ? 'text-emerald-600' : 'text-slate-400'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Two-Factor Authentication</p>
            <p className={cn('text-xs', entry.twoFactorEnabled ? 'text-emerald-600' : 'text-slate-400')}>
              {entry.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
            </p>
          </div>
          {entry.twoFactorEnabled
            ? <CheckCircle2 size={18} className="text-emerald-500 ml-auto" />
            : <XCircle size={18} className="text-slate-300 ml-auto" />}
        </div>
        {entry.authenticatorApp && (
          <InfoRow label="Authenticator" value={entry.authenticatorApp} />
        )}
      </div>

      {/* Encrypted sensitive data */}
      {(entry.hasBackupCodes || entry.hasAppPasswords || entry.hasSecurityQuestions) && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <Key size={14} className="text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Encrypted Security Data</p>
          </div>
          <div className="p-5 space-y-1">
            <RevealField label="Backup Codes" hasValue={entry.hasBackupCodes} onReveal={() => openReveal('backupCodes','Backup Codes')} revealed={revealedCodes} loading={revealLoading && revealModal?.field === 'backupCodes'} />
            <RevealField label="App Passwords" hasValue={entry.hasAppPasswords} onReveal={() => openReveal('appPasswords','App Passwords')} revealed={revealedAppPw} loading={revealLoading && revealModal?.field === 'appPasswords'} />
            <RevealField label="Security Questions" hasValue={entry.hasSecurityQuestions} onReveal={() => openReveal('securityQuestions','Security Questions')} revealed={revealedSQ} loading={revealLoading && revealModal?.field === 'securityQuestions'} />
          </div>
        </div>
      )}

      {/* No security data */}
      {!entry.hasBackupCodes && !entry.hasAppPasswords && !entry.hasSecurityQuestions && !entry.twoFactorEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Security information incomplete</p>
            <p className="text-xs text-amber-700 mt-0.5">Consider enabling 2FA and storing backup codes for better account security.</p>
            <Link to={`/vault/${entry.id}/edit`}>
              <Button variant="outline" size="sm" className="mt-3 border-amber-300 text-amber-700 hover:bg-amber-100">Improve Security</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  const renderNotes = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
          <Hash size={14} className="text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Private Notes</p>
        <span className="ml-auto text-xs text-slate-400 flex items-center gap-1"><Lock size={10} /> Encrypted</span>
      </div>
      <div className="p-5">
        {entry.hasNotes ? (
          revealedNotes !== null ? (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{revealedNotes}</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <Hash size={28} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">Notes are encrypted — reveal to read</p>
              <Button variant="outline" size="sm" leftIcon={Eye} onClick={() => openReveal('notes','Notes')}>
                Reveal Notes
              </Button>
            </div>
          )
        ) : (
          <div className="text-center py-8">
            <Hash size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No notes for this entry</p>
            <Link to={`/vault/${entry.id}/edit`}>
              <Button variant="outline" size="sm" className="mt-3">Add Notes</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
          <Activity size={14} className="text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Activity Log</p>
      </div>
      {activity.length === 0 ? (
        <div className="text-center py-10">
          <Activity size={28} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No activity recorded yet</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-50">
          {activity.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', log.success ? 'bg-emerald-50' : 'bg-red-50')}>
                {log.success ? <CheckCircle2 size={13} className="text-emerald-600" /> : <XCircle size={13} className="text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', LOG_COLORS[log.action] ?? 'bg-slate-100 text-slate-600')}>
                    {LOG_LABELS[log.action] ?? log.action}
                  </span>
                  {log.ipAddress && <span className="text-xs text-slate-400 font-mono">{log.ipAddress}</span>}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title={entry.title}
        description={PROVIDER_LABELS[entry.provider]}
        breadcrumb={['Vault', entry.title]}
        action={
          <div className="flex gap-2">
            <Link to={`/vault/${entry.id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={Edit}>Edit</Button>
            </Link>
            <Button variant="outline" size="sm" leftIcon={entry.archivedAt ? ArchiveX : Archive} onClick={handleArchive}>
              {entry.archivedAt ? 'Restore' : 'Archive'}
            </Button>
            <Button variant="outline" size="sm" leftIcon={Trash2} onClick={() => setDeleteModal(true)}
              className="border-red-200 text-red-600 hover:bg-red-50">
              Delete
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              tab === t
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {tab === 'Overview'     && renderOverview()}
          {tab === 'Credentials' && renderCredentials()}
          {tab === 'Recovery'    && renderRecovery()}
          {tab === 'Security'    && renderSecurity()}
          {tab === 'Notes'       && renderNotes()}
          {tab === 'Activity'    && renderActivity()}
        </motion.div>
      </AnimatePresence>

      {/* ── Master password reveal modal ────────────────────────────── */}
      <Modal open={!!revealModal} onClose={() => setRevealModal(null)} title={`Reveal ${revealModal?.label}`} icon={Shield} iconColor="bg-blue-600" size="xs">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Enter your master password to decrypt</p>
          <div className="relative">
            <input
              type={showMasterPwd ? 'text' : 'password'}
              value={masterPwd}
              onChange={(e) => { setMasterPwd(e.target.value); setRevealError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && doReveal()}
              placeholder="Master password"
              autoFocus
              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button type="button" onClick={() => setShowMasterPwd((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showMasterPwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {revealError && <p className="text-xs text-red-600">{revealError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setRevealModal(null)} fullWidth disabled={revealLoading}>Cancel</Button>
            <Button variant="primary" loading={revealLoading} onClick={doReveal} fullWidth>Reveal</Button>
          </div>
          <p className="text-center text-xs text-slate-400">Session verified for 30 minutes</p>
        </div>
      </Modal>

      {/* ── Delete with master password ─────────────────────────────── */}
      <Modal
        open={deleteModal}
        onClose={closeDeleteModal}
        title="Delete Entry"
        icon={Trash2}
        iconColor="bg-red-600"
        size="xs"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Permanently delete{' '}
            <strong className="text-slate-900">"{entry.title}"</strong>?
            This cannot be undone. Enter your master password to confirm.
          </p>
          <div className="relative">
            <input
              type={showDeletePwd ? 'text' : 'password'}
              value={deleteMasterPwd}
              onChange={(e) => { setDeleteMasterPwd(e.target.value); setDeleteError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleDelete()}
              placeholder="Master password"
              autoFocus
              className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowDeletePwd((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showDeletePwd ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeDeleteModal} fullWidth disabled={deleteLoading}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              loading={deleteLoading}
              fullWidth
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
