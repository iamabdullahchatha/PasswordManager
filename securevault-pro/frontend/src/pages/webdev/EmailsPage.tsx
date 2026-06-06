import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Users,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { useWebDevStore } from '../../store/webdevStore';
import { SUPPORTED_CURRENCIES } from '../../store/currencyStore';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  getDaysUntilExpiry, getExpiryVariant, EXPIRY_STYLES, formatDaysLabel,
  EMAIL_PROVIDER_LABELS, EMAIL_PROVIDER_OPTIONS,
} from '../../utils/webdev';
import { toast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import type { WebEmailAccount, EmailHostProvider } from '../../types';

const EMPTY_FORM = {
  emailAddress: '',
  domainName: '',
  provider: 'CPANEL' as EmailHostProvider,
  plan: '',
  purchaseDate: '',
  expiryDate: '',
  seats: '1',
  costPerYear: '',
  currency: 'USD',
  projectId: '',
  isActive: true,
  notes: '',
};

export default function EmailsPage() {
  const { emailAccounts, projects, addEmailAccount, updateEmailAccount, deleteEmailAccount } = useWebDevStore();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WebEmailAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebEmailAccount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (!search) return emailAccounts;
    const q = search.toLowerCase();
    return emailAccounts.filter(
      (e) =>
        e.emailAddress.toLowerCase().includes(q) ||
        e.domainName.toLowerCase().includes(q) ||
        EMAIL_PROVIDER_LABELS[e.provider].toLowerCase().includes(q),
    );
  }, [emailAccounts, search]);

  const openAdd = () => { setEditTarget(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (e: WebEmailAccount) => {
    setEditTarget(e);
    setForm({
      emailAddress: e.emailAddress, domainName: e.domainName, provider: e.provider,
      plan: e.plan ?? '', purchaseDate: e.purchaseDate, expiryDate: e.expiryDate ?? '',
      seats: String(e.seats), costPerYear: String(e.costPerYear),
      currency: e.currency, projectId: e.projectId ?? '', isActive: e.isActive,
      notes: e.notes ?? '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.emailAddress.trim()) errs.emailAddress = 'Email address is required';
    if (!form.domainName.trim()) errs.domainName = 'Domain is required';
    if (!form.purchaseDate) errs.purchaseDate = 'Purchase date is required';
    if (!form.costPerYear || isNaN(Number(form.costPerYear))) errs.costPerYear = 'Enter a valid cost';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload: Omit<WebEmailAccount, 'id' | 'createdAt' | 'updatedAt'> = {
      emailAddress: form.emailAddress.trim(),
      domainName: form.domainName.trim(),
      provider: form.provider,
      plan: form.plan.trim() || null,
      purchaseDate: form.purchaseDate,
      expiryDate: form.expiryDate || null,
      seats: Math.max(1, Number(form.seats) || 1),
      costPerYear: Number(form.costPerYear),
      currency: form.currency,
      projectId: form.projectId || null,
      isActive: form.isActive,
      notes: form.notes.trim() || null,
    };
    if (editTarget) {
      updateEmailAccount(editTarget.id, payload);
      toast('Email account updated', 'success');
    } else {
      addEmailAccount(payload);
      toast('Email account added', 'success');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    deleteEmailAccount(deleteTarget.id);
    toast('Email account removed', 'success');
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Hosting"
        description="Manage business email hosting accounts and renewals"
        icon={Mail}
        action={<Button variant="primary" size="sm" leftIcon={Plus} onClick={openAdd}>Add Account</Button>}
      />

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email accounts…"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-900">{emailAccounts.filter((e) => e.isActive).length}</span> active ·
          <span className="font-semibold text-slate-900">{emailAccounts.length}</span> total
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={search ? 'No matching accounts' : 'No email accounts yet'}
          description={search ? 'Try a different search' : 'Add email hosting accounts to track renewals and costs'}
          action={!search ? <Button variant="primary" leftIcon={Plus} onClick={openAdd}>Add Account</Button> : undefined}
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
                  {['Email / Domain', 'Provider', 'Plan', 'Seats', 'Purchase Date', 'Expiry', 'Cost/yr', 'Project', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-2xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((acc, i) => {
                  const linkedProject = acc.projectId ? projects.find((p) => p.id === acc.projectId) : null;
                  const expiryInfo = acc.expiryDate ? {
                    days: getDaysUntilExpiry(acc.expiryDate),
                    variant: getExpiryVariant(getDaysUntilExpiry(acc.expiryDate)),
                  } : null;
                  return (
                    <motion.tr
                      key={acc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-slate-900">{acc.emailAddress}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{acc.domainName}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{EMAIL_PROVIDER_LABELS[acc.provider]}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{acc.plan || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Users size={11} />{acc.seats}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(acc.purchaseDate)}</td>
                      <td className="px-4 py-3">
                        {expiryInfo ? (
                          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap', EXPIRY_STYLES[expiryInfo.variant].pill)}>
                            {formatDaysLabel(expiryInfo.days)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">No expiry</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">
                        {formatCurrency(acc.costPerYear, acc.currency)}
                      </td>
                      <td className="px-4 py-3">
                        {linkedProject ? (
                          <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                            {linkedProject.name}
                          </span>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {acc.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} />Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <XCircle size={10} />Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setDeleteTarget(acc)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
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
            <p className="text-xs text-slate-500">{filtered.length} account{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </motion.div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Email Account' : 'Add Email Account'}
        icon={Mail}
        iconColor="bg-indigo-500"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              required
              placeholder="info@example.com"
              value={form.emailAddress}
              onChange={(e) => f('emailAddress', e.target.value)}
              error={errors.emailAddress}
            />
            <Input
              label="Domain"
              required
              placeholder="example.com"
              value={form.domainName}
              onChange={(e) => f('domainName', e.target.value)}
              error={errors.domainName}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Email Provider"
              options={EMAIL_PROVIDER_OPTIONS}
              value={form.provider}
              onChange={(v) => f('provider', v)}
            />
            <Input
              label="Plan / Tier"
              placeholder="Business Starter, Pro…"
              value={form.plan}
              onChange={(e) => f('plan', e.target.value)}
            />
          </div>

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
              type="date"
              hint="Leave blank if no expiry"
              value={form.expiryDate}
              onChange={(e) => f('expiryDate', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Seats / Mailboxes"
              type="number"
              value={form.seats}
              onChange={(e) => f('seats', e.target.value)}
            />
            <Input
              label="Cost Per Year"
              required
              type="number"
              placeholder="50.00"
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

          {/* Active toggle */}
          <button
            type="button"
            onClick={() => f('isActive', !form.isActive)}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-sm font-semibold transition-all',
              form.isActive
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-500',
            )}
          >
            {form.isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {form.isActive ? 'Active Account' : 'Inactive Account'}
          </button>

          <Textarea
            label="Notes"
            rows={2}
            placeholder="Any additional notes…"
            value={form.notes}
            onChange={(e) => f('notes', e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              {editTarget ? 'Update Account' : 'Add Account'}
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Email Account"
        description={`Remove "${deleteTarget?.emailAddress}" from tracking?`}
        confirmLabel="Remove"
        variant="destructive"
        loading={deleting}
        icon={Trash2}
      />
    </div>
  );
}
