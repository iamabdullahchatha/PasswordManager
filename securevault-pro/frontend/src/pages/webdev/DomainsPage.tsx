import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Plus, Search, Edit2, Trash2, ExternalLink, RefreshCw,
  Shield, Server, Link as LinkIcon,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useWebDevStore } from '../../store/webdevStore';
import { useCurrencyStore, SUPPORTED_CURRENCIES } from '../../store/currencyStore';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  getDaysUntilExpiry, getExpiryVariant, EXPIRY_STYLES, formatDaysLabel,
  REGISTRAR_LABELS, REGISTRAR_OPTIONS,
} from '../../utils/webdev';
import { toast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import type { WebDomain, DomainRegistrar } from '../../types';

type FilterTab = 'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED';

const EMPTY_FORM = {
  name: '',
  registrar: 'NAMECHEAP' as DomainRegistrar,
  registrarUrl: '',
  purchaseDate: '',
  expiryDate: '',
  autoRenew: true,
  costPerYear: '',
  currency: 'USD',
  projectId: '',
  notes: '',
  nameservers: '',
  isPrivacyEnabled: false,
  isDnsManaged: false,
  tags: '',
};

export default function DomainsPage() {
  const { domains, projects, addDomain, updateDomain, deleteDomain } = useWebDevStore();
  const { currency } = useCurrencyStore();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WebDomain | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebDomain | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const counts = useMemo(() => ({
    ALL: domains.length,
    ACTIVE: domains.filter((d) => getDaysUntilExpiry(d.expiryDate) > 30).length,
    EXPIRING: domains.filter((d) => { const days = getDaysUntilExpiry(d.expiryDate); return days >= 0 && days <= 30; }).length,
    EXPIRED: domains.filter((d) => getDaysUntilExpiry(d.expiryDate) < 0).length,
  }), [domains]);

  const filtered = useMemo(() => {
    let list = domains;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || REGISTRAR_LABELS[d.registrar].toLowerCase().includes(q));
    }
    if (tab === 'ACTIVE')   list = list.filter((d) => getDaysUntilExpiry(d.expiryDate) > 30);
    if (tab === 'EXPIRING') list = list.filter((d) => { const days = getDaysUntilExpiry(d.expiryDate); return days >= 0 && days <= 30; });
    if (tab === 'EXPIRED')  list = list.filter((d) => getDaysUntilExpiry(d.expiryDate) < 0);
    return [...list].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [domains, search, tab]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (d: WebDomain) => {
    setEditTarget(d);
    setForm({
      name: d.name, registrar: d.registrar, registrarUrl: d.registrarUrl ?? '',
      purchaseDate: d.purchaseDate, expiryDate: d.expiryDate,
      autoRenew: d.autoRenew, costPerYear: String(d.costPerYear),
      currency: d.currency, projectId: d.projectId ?? '',
      notes: d.notes ?? '', nameservers: d.nameservers.join(', '),
      isPrivacyEnabled: d.isPrivacyEnabled, isDnsManaged: d.isDnsManaged,
      tags: d.tags.join(', '),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Domain name is required';
    if (!form.purchaseDate) e.purchaseDate = 'Purchase date is required';
    if (!form.expiryDate) e.expiryDate = 'Expiry date is required';
    if (!form.costPerYear || isNaN(Number(form.costPerYear))) e.costPerYear = 'Enter a valid cost';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload: Omit<WebDomain, 'id' | 'createdAt' | 'updatedAt'> = {
      name: form.name.trim().toLowerCase(),
      registrar: form.registrar,
      registrarUrl: form.registrarUrl.trim() || null,
      purchaseDate: form.purchaseDate,
      expiryDate: form.expiryDate,
      autoRenew: form.autoRenew,
      costPerYear: Number(form.costPerYear),
      currency: form.currency,
      projectId: form.projectId || null,
      notes: form.notes.trim() || null,
      nameservers: form.nameservers.split(',').map((s) => s.trim()).filter(Boolean),
      isPrivacyEnabled: form.isPrivacyEnabled,
      isDnsManaged: form.isDnsManaged,
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (editTarget) {
      updateDomain(editTarget.id, payload);
      toast('Domain updated', 'success');
    } else {
      addDomain(payload);
      toast('Domain added', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    deleteDomain(deleteTarget.id);
    toast('Domain deleted', 'success');
    setDeleting(false);
    setDeleteTarget(null);
  };

  const f = (k: keyof typeof form, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} – ${c.name}` }));
  const projectOptions = [
    { value: '', label: 'No project linked' },
    ...projects.map((p) => ({ value: p.id, label: p.name })),
  ];

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'ACTIVE', label: 'Active' },
    { key: 'EXPIRING', label: 'Expiring' },
    { key: 'EXPIRED', label: 'Expired' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domains"
        description="Track all your domain registrations and expiry dates"
        icon={Globe}
        action={<Button variant="primary" size="sm" leftIcon={Plus} onClick={openAdd}>Add Domain</Button>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domains…"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                tab === t.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t.label}
              <span className={cn(
                'ml-1.5 text-2xs font-bold px-1.5 py-0.5 rounded-full',
                tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500',
              )}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Globe}
          title={search ? 'No matching domains' : 'No domains yet'}
          description={search ? 'Try a different search term' : 'Add your first domain to start tracking renewals'}
          action={!search ? <Button variant="primary" leftIcon={Plus} onClick={openAdd}>Add Domain</Button> : undefined}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Domain', 'Registrar', 'Purchase Date', 'Expiry', 'Time Left', 'Cost/yr', 'Auto-Renew', 'Project', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-2xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((domain, i) => {
                  const days = getDaysUntilExpiry(domain.expiryDate);
                  const variant = getExpiryVariant(days);
                  const style = EXPIRY_STYLES[variant];
                  const linkedProject = domain.projectId ? projects.find((p) => p.id === domain.projectId) : null;
                  return (
                    <motion.tr
                      key={domain.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', style.dot)} />
                          <span className="text-sm font-semibold text-slate-900">{domain.name}</span>
                          {domain.registrarUrl && (
                            <a href={domain.registrarUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors">
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {domain.isPrivacyEnabled && (
                            <span className="inline-flex items-center gap-1 text-2xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Shield size={9} />Privacy
                            </span>
                          )}
                          {domain.isDnsManaged && (
                            <span className="inline-flex items-center gap-1 text-2xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Server size={9} />DNS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700">{REGISTRAR_LABELS[domain.registrar]}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(domain.purchaseDate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(domain.expiryDate)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap', style.pill)}>
                          {formatDaysLabel(days)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {formatCurrency(domain.costPerYear, domain.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                          domain.autoRenew
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200',
                        )}>
                          {domain.autoRenew && <RefreshCw size={10} />}
                          {domain.autoRenew ? 'On' : 'Off'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {linkedProject ? (
                          <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[100px] block">
                            {linkedProject.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(domain)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(domain)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
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
          <div className="px-4 py-2.5 border-t border-slate-50 bg-slate-50/50">
            <p className="text-xs text-slate-500">{filtered.length} domain{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </motion.div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Domain' : 'Add Domain'}
        description={editTarget ? `Editing ${editTarget.name}` : 'Track a new domain registration'}
        icon={Globe}
        iconColor="bg-blue-500"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Domain Name"
              required
              placeholder="example.com"
              value={form.name}
              onChange={(e) => f('name', e.target.value)}
              error={errors.name}
            />
            <Select
              label="Registrar"
              required
              options={REGISTRAR_OPTIONS}
              value={form.registrar}
              onChange={(v) => f('registrar', v)}
            />
          </div>

          <Input
            label="Registrar Control Panel URL"
            placeholder="https://namecheap.com/domains/…"
            leftIcon={LinkIcon}
            value={form.registrarUrl}
            onChange={(e) => f('registrarUrl', e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Purchase Date"
              required
              type="date"
              value={form.purchaseDate}
              onChange={(e) => f('purchaseDate', e.target.value)}
              error={errors.purchaseDate}
            />
            <Input
              label="Expiry Date"
              required
              type="date"
              value={form.expiryDate}
              onChange={(e) => f('expiryDate', e.target.value)}
              error={errors.expiryDate}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Cost Per Year"
              required
              type="number"
              placeholder="12.99"
              value={form.costPerYear}
              onChange={(e) => f('costPerYear', e.target.value)}
              error={errors.costPerYear}
            />
            <Select
              label="Currency"
              options={currencyOptions}
              value={form.currency}
              onChange={(v) => f('currency', v)}
            />
          </div>

          <Select
            label="Linked Project"
            options={projectOptions}
            value={form.projectId}
            onChange={(v) => f('projectId', v)}
          />

          <Input
            label="Nameservers"
            placeholder="ns1.example.com, ns2.example.com"
            hint="Comma-separated list of nameservers"
            value={form.nameservers}
            onChange={(e) => f('nameservers', e.target.value)}
          />

          {/* Toggles */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'autoRenew', label: 'Auto-Renew', icon: RefreshCw },
              { key: 'isPrivacyEnabled', label: 'Privacy Protection', icon: Shield },
              { key: 'isDnsManaged', label: 'DNS Managed', icon: Server },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => f(key, !form[key])}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold',
                  form[key]
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300',
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <Input
            label="Tags"
            placeholder="personal, client, business"
            hint="Comma-separated"
            value={form.tags}
            onChange={(e) => f('tags', e.target.value)}
          />

          <Textarea
            label="Notes"
            rows={2}
            placeholder="Any additional notes…"
            value={form.notes}
            onChange={(e) => f('notes', e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              {editTarget ? 'Update Domain' : 'Add Domain'}
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Domain"
        description={`Remove "${deleteTarget?.name}" from tracking? This cannot be undone.`}
        confirmLabel="Delete Domain"
        variant="destructive"
        loading={deleting}
        icon={Trash2}
      />
    </div>
  );
}
