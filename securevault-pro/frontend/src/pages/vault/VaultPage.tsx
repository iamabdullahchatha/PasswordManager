import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Star, StarOff, Shield, Eye, EyeOff, Trash2, Edit,
  ExternalLink, Key, Clock, AlertTriangle, X, LayoutGrid, List,
  Filter, SlidersHorizontal, Archive, ArchiveX, ChevronDown,
  TrendingDown, RefreshCw, ShieldAlert, CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { CopyButton } from '../../components/ui/CopyButton';
import { vaultService, type VaultListParams } from '../../services/vault.service';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { formatRelativeTime } from '../../utils/format';
import { cn } from '../../utils/cn';
import type { VaultEntry, EmailProvider, ImportanceLevel } from '../../types';
import { ProviderIcon, PROVIDER_LABELS } from '../../components/vault/ProviderIcon';

/* ── Strength bar ──────────────────────────────────────────────────────── */
const S_CFG = [
  { max: 20,  bar: 'bg-red-500',     text: 'text-red-600',     label: 'Very Weak'   },
  { max: 40,  bar: 'bg-orange-400',  text: 'text-orange-600',  label: 'Weak'        },
  { max: 60,  bar: 'bg-yellow-400',  text: 'text-yellow-600',  label: 'Fair'        },
  { max: 80,  bar: 'bg-blue-500',    text: 'text-blue-600',    label: 'Strong'      },
  { max: 101, bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Very Strong' },
];
function StrengthBar({ score }: { score: number | null }) {
  if (score === null) return null;
  const cfg = S_CFG.find((c) => score < c.max) ?? S_CFG[4];
  const filled = Math.ceil((score / 100) * 5);
  return (
    <div className="flex items-center gap-1.5 mt-2">
      <div className="flex gap-0.5 flex-1">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full', i <= filled ? cfg.bar : 'bg-slate-100')} />
        ))}
      </div>
      <span className={cn('text-[10px] font-bold w-[54px] text-right flex-shrink-0', cfg.text)}>{cfg.label}</span>
    </div>
  );
}

/* ── Importance badge ──────────────────────────────────────────────────── */
const IMP_CFG: Record<ImportanceLevel, { variant: 'destructive' | 'warning' | 'default' | 'secondary'; label: string }> = {
  CRITICAL: { variant: 'destructive', label: 'Critical' },
  HIGH:     { variant: 'warning',     label: 'High'     },
  MEDIUM:   { variant: 'default',     label: 'Medium'   },
  LOW:      { variant: 'secondary',   label: 'Low'      },
};

/* ── Platform avatar gradient ─────────────────────────────────────────── */
const GRADS = ['from-blue-500 to-blue-600','from-violet-500 to-violet-600','from-emerald-500 to-emerald-600','from-orange-500 to-orange-600','from-pink-500 to-pink-600','from-cyan-500 to-cyan-600','from-indigo-500 to-indigo-600','from-teal-500 to-teal-600'];
const grad  = (s: string) => GRADS[s.charCodeAt(0) % GRADS.length];

const ALL_PROVIDERS: EmailProvider[] = [
  'GMAIL','OUTLOOK','YAHOO','ZOHO','ICLOUD','PROTONMAIL','FASTMAIL','BUSINESS',
  'FACEBOOK','INSTAGRAM','WHATSAPP','SNAPCHAT','TWITTER','TIKTOK','YOUTUBE',
  'LINKEDIN','DISCORD','TELEGRAM','REDDIT','PINTEREST','TWITCH',
  'BINANCE','PAYPAL','COINBASE',
  'GITHUB','GOOGLE','APPLE','MICROSOFT','AMAZON','NETFLIX','SPOTIFY','SHOPIFY','STEAM',
  'CUSTOM',
];
const ALL_IMPORTANCE: ImportanceLevel[] = ['CRITICAL','HIGH','MEDIUM','LOW'];

export default function VaultPage() {
  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();

  /* ── State ─────────────────────────────────────────────────────────── */
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view,    setView]    = useState<'grid' | 'list'>('grid');

  // Search / filter
  const [search,    setSearch]    = useState(searchParams.get('search') ?? '');
  const debouncedSearch           = useDebounce(search, 400);
  const [provider,  setProvider]  = useState<EmailProvider | ''>('');
  const [importance,setImportance]= useState<ImportanceLevel | ''>('');
  const [health,    setHealth]    = useState<'weak' | 'old' | 'expiring' | ''>('');
  const [favOnly,   setFavOnly]   = useState(false);
  const [archived,  setArchived]  = useState(false);
  const [sortBy,    setSortBy]    = useState<VaultListParams['sortBy']>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterOpen,setFilterOpen]= useState(false);

  // Reveal
  const [revealModal,    setRevealModal]    = useState(false);
  const [selectedEntry,  setSelectedEntry]  = useState<VaultEntry | null>(null);
  const [masterPwd,      setMasterPwd]      = useState('');
  const [showMasterPwd,  setShowMasterPwd]  = useState(false);
  const [revealedPwd,    setRevealedPwd]    = useState<string | null>(null);
  const [showPwd,        setShowPwd]        = useState(false);
  const [revealLoading,  setRevealLoading]  = useState(false);
  const [revealError,    setRevealError]    = useState('');
  const [viewModal,      setViewModal]      = useState(false);

  // Delete with master password
  const [deleteTarget,     setDeleteTarget]     = useState<VaultEntry | null>(null);
  const [deleteMasterPwd,  setDeleteMasterPwd]  = useState('');
  const [showDeletePwd,    setShowDeletePwd]    = useState(false);
  const [deleteError,      setDeleteError]      = useState('');
  const [deleteLoading,    setDeleteLoading]    = useState(false);

  /* ── Fetch ─────────────────────────────────────────────────────────── */
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params: VaultListParams = {};
      if (debouncedSearch) params.search    = debouncedSearch;
      if (provider)         params.provider  = provider as EmailProvider;
      if (importance)       params.importance= importance as ImportanceLevel;
      if (health)           params.health    = health;
      if (favOnly)          params.isFavorite= true;
      if (archived)         params.archived  = true;
      params.sortBy    = sortBy;
      params.sortOrder = sortOrder;
      const res = await vaultService.list(params);
      setEntries(res.data ?? []);
    } finally { setLoading(false); }
  }, [debouncedSearch, provider, importance, health, favOnly, archived, sortBy, sortOrder]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  /* ── Actions ───────────────────────────────────────────────────────── */
  const toggleFav = async (e: VaultEntry, ev: React.MouseEvent) => {
    ev.stopPropagation();
    try {
      await vaultService.toggleFavorite(e.id);
      setEntries((p) => p.map((x) => x.id === e.id ? { ...x, isFavorite: !x.isFavorite } : x));
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const toggleArchive = async (e: VaultEntry, ev: React.MouseEvent) => {
    ev.stopPropagation();
    try {
      const res = await vaultService.toggleArchive(e.id);
      if (res.data) {
        setEntries((p) => p.map((x) => x.id === e.id ? { ...x, archivedAt: res.data!.archivedAt } : x));
        toast(e.archivedAt ? 'Entry restored from archive' : 'Entry archived', 'success');
      }
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const openReveal = (e: VaultEntry) => {
    setSelectedEntry(e); setRevealedPwd(null); setRevealError('');
    setMasterPwd(''); setShowMasterPwd(false); setRevealModal(true);
  };

  const fetchPassword = async () => {
    if (!selectedEntry || !masterPwd.trim()) { setRevealError('Enter your master password'); return; }
    setRevealLoading(true); setRevealError('');
    try {
      const res = await vaultService.reveal(selectedEntry.id, masterPwd, 'password');
      if (res.data?.value !== undefined) {
        setRevealedPwd(res.data.value);
        setRevealModal(false); setMasterPwd(''); setShowPwd(false); setViewModal(true);
      }
    } catch (err) { setRevealError(getErrorMessage(err)); }
    finally { setRevealLoading(false); }
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteMasterPwd('');
    setShowDeletePwd(false);
    setDeleteError('');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (!deleteMasterPwd.trim()) { setDeleteError('Enter your master password'); return; }
    setDeleteLoading(true); setDeleteError('');
    try {
      await vaultService.delete(deleteTarget.id, deleteMasterPwd);
      setEntries((p) => p.filter((e) => e.id !== deleteTarget.id));
      closeDeleteModal();
      toast('Entry deleted', 'success');
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally { setDeleteLoading(false); }
  };

  /* ── Derived ───────────────────────────────────────────────────────── */
  const weakCount   = entries.filter((e) => (e.passwordStrength ?? 100) < 40).length;
  const activeFilters = [provider, importance, health, favOnly ? 'fav' : ''].filter(Boolean).length;

  /* ── Card renderer ─────────────────────────────────────────────────── */
  const renderCard = (entry: VaultEntry, i: number) => {
    const isWeak = (entry.passwordStrength ?? 100) < 40;
    const impCfg = IMP_CFG[entry.importanceLevel];
    return (
      <motion.div
        key={entry.id}
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ delay: Math.min(i * 0.04, 0.3) }}
        onClick={() => navigate(`/vault/${entry.id}`)}
        className={cn(
          'bg-white rounded-2xl border shadow-card hover:shadow-card-hover transition-all duration-200 group cursor-pointer overflow-hidden',
          isWeak ? 'border-amber-200' : 'border-slate-200',
          entry.archivedAt && 'opacity-60',
        )}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm', 'bg-gradient-to-br', grad(entry.platformName))}>
                <ProviderIcon provider={entry.provider} size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{entry.title}</p>
                <p className="text-xs text-slate-500 truncate">{entry.emailAddress}</p>
              </div>
            </div>
            <button
              onClick={(ev) => toggleFav(entry, ev)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              {entry.isFavorite
                ? <Star size={14} className="fill-amber-400 text-amber-400" />
                : <StarOff size={14} className="text-slate-300 group-hover:text-slate-400" />}
            </button>
          </div>

          <StrengthBar score={entry.passwordStrength} />

          <div className="flex flex-wrap gap-1.5 mt-3">
            <Badge variant={impCfg.variant} size="xs">{impCfg.label}</Badge>
            {entry.twoFactorEnabled && <Badge variant="success" size="xs" dot>2FA</Badge>}
            {isWeak && <Badge variant="warning" size="xs">Weak</Badge>}
            {entry.tags.slice(0, 2).map((t) => <Badge key={t.name} variant="outline" size="xs">{t.name}</Badge>)}
          </div>

          {entry.lastAccessedAt && (
            <p className="text-[10px] text-slate-400 mt-2.5 flex items-center gap-1">
              <Clock size={9} /> {formatRelativeTime(entry.lastAccessedAt)}
            </p>
          )}
        </div>

        {/* Hover actions */}
        <div className="px-5 py-3 border-t border-slate-50 flex items-center gap-1 bg-slate-50/60 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150">
          <button
            onClick={(ev) => { ev.stopPropagation(); openReveal(entry); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Eye size={12} /> View Password
          </button>
          {entry.platformUrl && (
            <a href={entry.platformUrl} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <ExternalLink size={13} />
            </a>
          )}
          <Link to={`/vault/${entry.id}/edit`} onClick={(ev) => ev.stopPropagation()}>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <Edit size={13} />
            </button>
          </Link>
          <button
            onClick={(ev) => { ev.stopPropagation(); toggleArchive(entry, ev); }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title={entry.archivedAt ? 'Restore' : 'Archive'}
          >
            {entry.archivedAt ? <ArchiveX size={13} /> : <Archive size={13} />}
          </button>
          <button
            onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(entry); }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Password Vault"
        description={`${entries.length} entries · AES-256-GCM encrypted`}
        icon={Shield}
        action={
          <div className="flex items-center gap-2">
            <Link to="/vault/security">
              <Button variant="outline" size="sm" leftIcon={ShieldAlert}>Health Report</Button>
            </Link>
            <Link to="/vault/new">
              <Button variant="primary" leftIcon={Plus}>Add Entry</Button>
            </Link>
          </div>
        }
      />

      {/* Security alert */}
      {weakCount > 0 && !archived && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {weakCount} {weakCount === 1 ? 'entry has a' : 'entries have'} weak password
            </p>
            <p className="text-xs text-amber-600/80 mt-0.5">Improve these to raise your security score</p>
          </div>
          <button onClick={() => setHealth('weak')} className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
            Filter Weak
          </button>
        </motion.div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, email, provider…"
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter button */}
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
              filterOpen || activeFilters > 0
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilters > 0 && (
              <span className="ml-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {activeFilters}
              </span>
            )}
          </button>

          {/* Favorites */}
          <button
            onClick={() => setFavOnly((p) => !p)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
              favOnly ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            <Star size={14} className={favOnly ? 'fill-amber-400 text-amber-400' : ''} />
            Favorites
          </button>

          {/* Archived toggle */}
          <button
            onClick={() => setArchived((p) => !p)}
            className={cn(
              'flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
              archived ? 'bg-slate-100 border-slate-400 text-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            <Archive size={14} />
            {archived ? 'Archived' : 'Active'}
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button onClick={() => setView('grid')} className={cn('p-2.5 transition-colors', view === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600')}>
              <LayoutGrid size={15} />
            </button>
            <button onClick={() => setView('list')} className={cn('p-2.5 transition-colors', view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600')}>
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Provider */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</label>
                  <SelectMenu
                    size="sm"
                    ariaLabel="Filter by provider"
                    value={provider}
                    onChange={(v) => setProvider(v as EmailProvider | '')}
                    options={[
                      { value: '', label: 'All providers' },
                      ...ALL_PROVIDERS.map((p) => ({ value: p, label: PROVIDER_LABELS[p] })),
                    ]}
                  />
                </div>

                {/* Importance */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Importance</label>
                  <SelectMenu
                    size="sm"
                    ariaLabel="Filter by importance"
                    value={importance}
                    onChange={(v) => setImportance(v as ImportanceLevel | '')}
                    options={[
                      { value: '', label: 'All levels' },
                      ...ALL_IMPORTANCE.map((l) => ({ value: l, label: l.charAt(0) + l.slice(1).toLowerCase() })),
                    ]}
                  />
                </div>

                {/* Health */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password Health</label>
                  <SelectMenu
                    size="sm"
                    ariaLabel="Filter by password health"
                    value={health}
                    onChange={(v) => setHealth(v as 'weak' | 'old' | 'expiring' | '')}
                    options={[
                      { value: '', label: 'All entries' },
                      { value: 'weak', label: 'Weak passwords' },
                      { value: 'old', label: 'Old (90+ days)' },
                      { value: 'expiring', label: 'Expiring soon' },
                    ]}
                  />
                </div>

                {/* Sort */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sort by</label>
                  <div className="flex gap-2">
                    <SelectMenu
                      size="sm"
                      className="flex-1"
                      ariaLabel="Sort by"
                      value={sortBy ?? 'updatedAt'}
                      onChange={(v) => setSortBy(v as VaultListParams['sortBy'])}
                      options={[
                        { value: 'updatedAt', label: 'Last updated' },
                        { value: 'createdAt', label: 'Date added' },
                        { value: 'title', label: 'Title' },
                        { value: 'importanceLevel', label: 'Importance' },
                        { value: 'lastAccessedAt', label: 'Last used' },
                      ]}
                    />
                    <button
                      onClick={() => setSortOrder((p) => p === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium"
                    >
                      {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                    </button>
                  </div>
                </div>
              </div>

              {activeFilters > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => { setProvider(''); setImportance(''); setHealth(''); setFavOnly(false); }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X size={12} /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Shield}
          title={archived ? 'No archived entries' : search || activeFilters > 0 ? 'No entries match' : 'No vault entries'}
          description={
            archived ? 'Archived entries will appear here' :
            search || activeFilters > 0 ? 'Try adjusting your search or filters' :
            'Store your first set of credentials securely'
          }
          action={
            !search && !activeFilters && !archived
              ? <Link to="/vault/new"><Button variant="primary" leftIcon={Plus}>Add First Entry</Button></Link>
              : undefined
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {entries.map((e, i) => renderCard(e, i))}
          </AnimatePresence>
        </div>
      ) : (
        /* ── List view ──────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Account', 'Provider', 'Importance', 'Strength', '2FA', 'Last Updated', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map((entry, i) => {
                  const isWeak = (entry.passwordStrength ?? 100) < 40;
                  const impCfg = IMP_CFG[entry.importanceLevel];
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      onClick={() => navigate(`/vault/${entry.id}`)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm bg-gradient-to-br', grad(entry.platformName))}>
                            <ProviderIcon provider={entry.provider} size={14} className="text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">{entry.title}</p>
                              {entry.isFavorite && <Star size={11} className="fill-amber-400 text-amber-400 flex-shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-500 truncate max-w-[160px]">{entry.emailAddress}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-600">{PROVIDER_LABELS[entry.provider]}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={impCfg.variant} size="xs">{impCfg.label}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {entry.passwordStrength !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1,2,3,4,5].map((i) => {
                                const filled = Math.ceil(((entry.passwordStrength ?? 0) / 100) * 5);
                                const cfg = S_CFG.find((c) => (entry.passwordStrength ?? 0) < c.max) ?? S_CFG[4];
                                return <div key={i} className={cn('h-1.5 w-4 rounded-full', i <= filled ? cfg.bar : 'bg-slate-100')} />;
                              })}
                            </div>
                            <span className="text-xs text-slate-500">{entry.passwordStrength}%</span>
                          </div>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {entry.twoFactorEnabled
                          ? <CheckCircle2 size={15} className="text-emerald-500" />
                          : <span className="text-xs text-slate-400">Off</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {formatRelativeTime(entry.updatedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(ev) => { ev.stopPropagation(); openReveal(entry); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Reveal">
                            <Eye size={13} />
                          </button>
                          <Link to={`/vault/${entry.id}/edit`} onClick={(ev) => ev.stopPropagation()}>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                              <Edit size={13} />
                            </button>
                          </Link>
                          <button onClick={(ev) => { ev.stopPropagation(); setDeleteTarget(entry); }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Master password modal ───────────────────────────────────── */}
      <Modal open={revealModal} onClose={() => setRevealModal(false)} title={`${selectedEntry?.title} — Reveal`} icon={Key} iconColor="bg-blue-600" size="xs">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Enter your master password to decrypt</p>
          <div className="relative">
            <input
              type={showMasterPwd ? 'text' : 'password'}
              value={masterPwd}
              onChange={(e) => { setMasterPwd(e.target.value); setRevealError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && fetchPassword()}
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
            <Button variant="outline" onClick={() => setRevealModal(false)} fullWidth>Cancel</Button>
            <Button variant="primary" loading={revealLoading} onClick={fetchPassword} fullWidth>Reveal</Button>
          </div>
        </div>
      </Modal>

      {/* ── View revealed password modal ────────────────────────────── */}
      <Modal open={viewModal} onClose={() => { setViewModal(false); setRevealedPwd(null); }} title={`${selectedEntry?.title} — Password`} icon={Key} iconColor="bg-blue-600" size="sm">
        {revealedPwd !== null && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-200 overflow-hidden">
              <div className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email / Username</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-900 flex-1 font-mono">{selectedEntry?.emailAddress}</p>
                  <CopyButton value={selectedEntry?.emailAddress ?? ''} size="sm" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</p>
                  <button onClick={() => setShowPwd((p) => !p)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    {showPwd ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm flex-1 font-mono break-all', !showPwd && 'blur-sm select-none')}>{revealedPwd}</p>
                  <CopyButton value={revealedPwd} size="sm" onCopy={() => vaultService.logCopy(selectedEntry!.id)} />
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
              <Clock size={10} /> Clipboard clears automatically in 30 seconds
            </p>
          </div>
        )}
      </Modal>

      {/* ── Delete with master password ─────────────────────────────── */}
      <Modal
        open={!!deleteTarget}
        onClose={closeDeleteModal}
        title="Delete Entry"
        icon={Trash2}
        iconColor="bg-red-600"
        size="xs"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Permanently delete{' '}
            <strong className="text-slate-900">"{deleteTarget?.title}"</strong>?
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
