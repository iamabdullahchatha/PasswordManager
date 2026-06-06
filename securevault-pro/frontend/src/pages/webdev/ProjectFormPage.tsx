import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, User, Globe, Mail, DollarSign, Settings2,
  Link as LinkIcon, FileText, ChevronDown, ChevronUp, Check,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { useWebDevStore } from '../../store/webdevStore';
import { SUPPORTED_CURRENCIES } from '../../store/currencyStore';
import {
  ALL_SERVICES, SERVICE_LABELS, PROJECT_STATUS_LABELS, PAYMENT_STATUS_LABELS,
} from '../../utils/webdev';
import { toast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import type { ProjectStatus, ClientPaymentStatus, WebProjectService } from '../../types';

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_OPTIONS: { value: ClientPaymentStatus; label: string }[] = [
  { value: 'PAID', label: 'Paid' },
  { value: 'PARTIAL', label: 'Partial Payment' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'OVERDUE', label: 'Overdue' },
];

const defaultForm = () => ({
  name: '',
  description: '',
  status: 'ACTIVE' as ProjectStatus,
  startDate: '',
  endDate: '',
  liveUrl: '',
  stagingUrl: '',
  repositoryUrl: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientCompany: '',
  services: [] as WebProjectService[],
  clientCharged: '',
  currency: 'USD',
  paymentStatus: 'PENDING' as ClientPaymentStatus,
  invoiceDate: '',
  dueDate: '',
  domainCost: '',
  emailCost: '',
  hostingCost: '',
  designCost: '',
  developmentCost: '',
  maintenanceCost: '',
  otherCost: '',
  domainIds: [] as string[],
  emailIds: [] as string[],
  notes: '',
  tags: '',
});

type FormState = ReturnType<typeof defaultForm>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectionCard({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Icon size={15} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, domains, emailAccounts, addProject, updateProject } = useWebDevStore();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(defaultForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const currencyOptions = SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} – ${c.name}` }));

  useEffect(() => {
    if (!isEdit || !id) return;
    const project = projects.find((p) => p.id === id);
    if (!project) { navigate('/webdev/projects'); return; }
    setForm({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
      startDate: project.startDate ?? '',
      endDate: project.endDate ?? '',
      liveUrl: project.liveUrl ?? '',
      stagingUrl: project.stagingUrl ?? '',
      repositoryUrl: project.repositoryUrl ?? '',
      clientName: project.clientName,
      clientEmail: project.clientEmail ?? '',
      clientPhone: project.clientPhone ?? '',
      clientCompany: project.clientCompany ?? '',
      services: project.services,
      clientCharged: String(project.clientCharged),
      currency: project.currency,
      paymentStatus: project.paymentStatus,
      invoiceDate: project.invoiceDate ?? '',
      dueDate: project.dueDate ?? '',
      domainCost: String(project.domainCost),
      emailCost: String(project.emailCost),
      hostingCost: String(project.hostingCost),
      designCost: String(project.designCost),
      developmentCost: String(project.developmentCost),
      maintenanceCost: String(project.maintenanceCost),
      otherCost: String(project.otherCost),
      domainIds: project.domainIds,
      emailIds: project.emailIds,
      notes: project.notes ?? '',
      tags: project.tags.join(', '),
    });
  }, [id, isEdit, projects, navigate]);

  const f = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v })), []);

  const toggleService = (s: WebProjectService) => {
    setForm((p) => ({
      ...p,
      services: p.services.includes(s) ? p.services.filter((x) => x !== s) : [...p.services, s],
    }));
  };

  const toggleDomain = (did: string) => {
    setForm((p) => ({
      ...p,
      domainIds: p.domainIds.includes(did) ? p.domainIds.filter((x) => x !== did) : [...p.domainIds, did],
    }));
  };

  const toggleEmail = (eid: string) => {
    setForm((p) => ({
      ...p,
      emailIds: p.emailIds.includes(eid) ? p.emailIds.filter((x) => x !== eid) : [...p.emailIds, eid],
    }));
  };

  const n = (s: string) => (s.trim() === '' || isNaN(Number(s)) ? 0 : Number(s));

  const totalCost = n(form.domainCost) + n(form.emailCost) + n(form.hostingCost)
    + n(form.designCost) + n(form.developmentCost) + n(form.maintenanceCost) + n(form.otherCost);
  const profit = n(form.clientCharged) - totalCost;
  const isProfit = profit >= 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.clientName.trim()) e.clientName = 'Client name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        liveUrl: form.liveUrl.trim() || null,
        stagingUrl: form.stagingUrl.trim() || null,
        repositoryUrl: form.repositoryUrl.trim() || null,
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim() || null,
        clientPhone: form.clientPhone.trim() || null,
        clientCompany: form.clientCompany.trim() || null,
        services: form.services,
        clientCharged: n(form.clientCharged),
        currency: form.currency,
        paymentStatus: form.paymentStatus,
        invoiceDate: form.invoiceDate || null,
        dueDate: form.dueDate || null,
        domainCost: n(form.domainCost),
        emailCost: n(form.emailCost),
        hostingCost: n(form.hostingCost),
        designCost: n(form.designCost),
        developmentCost: n(form.developmentCost),
        maintenanceCost: n(form.maintenanceCost),
        otherCost: n(form.otherCost),
        domainIds: form.domainIds,
        emailIds: form.emailIds,
        notes: form.notes.trim() || null,
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (isEdit && id) {
        updateProject(id, payload);
        toast('Project updated', 'success');
      } else {
        addProject(payload);
        toast('Project created', 'success');
      }
      navigate('/webdev/projects');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PageHeader
        title={isEdit ? 'Edit Project' : 'New Project'}
        description={isEdit ? 'Update project details, billing and resources' : 'Create a project to track client work, costs and revenue'}
        icon={Briefcase}
        breadcrumb={['Web Developer', 'Projects', isEdit ? 'Edit' : 'New']}
        action={
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/webdev/projects')}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        }
      />

      {/* Live Profit Preview */}
      {(n(form.clientCharged) > 0 || totalCost > 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'rounded-2xl border-2 p-4',
            isProfit ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50',
          )}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-slate-500 font-medium">Charged</p>
                <p className="text-lg font-black text-slate-900">{n(form.clientCharged).toLocaleString()} {form.currency}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Cost</p>
                <p className="text-lg font-black text-slate-900">{totalCost.toLocaleString()} {form.currency}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-medium">Profit / Loss</p>
              <p className={cn('text-2xl font-black', isProfit ? 'text-emerald-700' : 'text-red-700')}>
                {isProfit ? '+' : ''}{profit.toLocaleString()} {form.currency}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 1: Basic Info */}
      <SectionCard title="Project Info" icon={Briefcase}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Project Name"
                required
                placeholder="Client Website Redesign"
                value={form.name}
                onChange={(e) => f('name', e.target.value)}
                error={errors.name}
              />
            </div>
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(v) => f('status', v as ProjectStatus)}
            />
          </div>

          <Textarea
            label="Description"
            rows={2}
            placeholder="Brief description of the project…"
            value={form.description}
            onChange={(e) => f('description', e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => f('startDate', e.target.value)} />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => f('endDate', e.target.value)} />
          </div>
        </div>
      </SectionCard>

      {/* Section 2: URLs */}
      <SectionCard title="URLs & Links" icon={LinkIcon} defaultOpen={false}>
        <div className="space-y-3">
          <Input
            label="Live URL"
            placeholder="https://www.clientsite.com"
            leftIcon={Globe}
            value={form.liveUrl}
            onChange={(e) => f('liveUrl', e.target.value)}
          />
          <Input
            label="Staging / Dev URL"
            placeholder="https://staging.clientsite.com"
            leftIcon={Globe}
            value={form.stagingUrl}
            onChange={(e) => f('stagingUrl', e.target.value)}
          />
          <Input
            label="Repository URL"
            placeholder="https://github.com/org/repo"
            leftIcon={LinkIcon}
            value={form.repositoryUrl}
            onChange={(e) => f('repositoryUrl', e.target.value)}
          />
        </div>
      </SectionCard>

      {/* Section 3: Client */}
      <SectionCard title="Client Information" icon={User}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Name"
              required
              placeholder="John Smith"
              value={form.clientName}
              onChange={(e) => f('clientName', e.target.value)}
              error={errors.clientName}
            />
            <Input
              label="Company"
              placeholder="Acme Corp"
              value={form.clientCompany}
              onChange={(e) => f('clientCompany', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Email"
              type="email"
              placeholder="client@example.com"
              value={form.clientEmail}
              onChange={(e) => f('clientEmail', e.target.value)}
            />
            <Input
              label="Client Phone"
              placeholder="+1 234 567 8900"
              value={form.clientPhone}
              onChange={(e) => f('clientPhone', e.target.value)}
            />
          </div>
        </div>
      </SectionCard>

      {/* Section 4: Services */}
      <SectionCard title="Services Provided" icon={Settings2}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {ALL_SERVICES.map((s) => {
            const selected = form.services.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all text-left',
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                )}
              >
                {selected && <Check size={12} className="flex-shrink-0" />}
                {SERVICE_LABELS[s]}
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Section 5: Financial */}
      <SectionCard title="Financial Details" icon={DollarSign}>
        <div className="space-y-5">
          {/* Client billing */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Client Billing</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="Amount Charged"
                type="number"
                placeholder="0.00"
                value={form.clientCharged}
                onChange={(e) => f('clientCharged', e.target.value)}
              />
              <Select
                label="Currency"
                options={currencyOptions}
                value={form.currency}
                onChange={(v) => f('currency', v)}
              />
              <Select
                label="Payment Status"
                options={PAYMENT_OPTIONS}
                value={form.paymentStatus}
                onChange={(v) => f('paymentStatus', v as ClientPaymentStatus)}
              />
              <Input
                label="Invoice Date"
                type="date"
                value={form.invoiceDate}
                onChange={(e) => f('invoiceDate', e.target.value)}
              />
            </div>
            <div className="mt-3">
              <Input
                label="Payment Due Date"
                type="date"
                value={form.dueDate}
                onChange={(e) => f('dueDate', e.target.value)}
              />
            </div>
          </div>

          {/* Cost breakdown */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cost Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {([
                { key: 'domainCost',       label: 'Domain' },
                { key: 'emailCost',        label: 'Email Hosting' },
                { key: 'hostingCost',      label: 'Web Hosting' },
                { key: 'designCost',       label: 'Design' },
                { key: 'developmentCost',  label: 'Development' },
                { key: 'maintenanceCost',  label: 'Maintenance' },
                { key: 'otherCost',        label: 'Other' },
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form[key]}
                    onChange={(e) => f(key, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              ))}
              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Total Cost</label>
                <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-sm font-bold text-slate-800">
                  {totalCost.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Section 6: Linked Resources */}
      <SectionCard title="Linked Domains & Emails" icon={Globe} defaultOpen={false}>
        <div className="space-y-5">
          {/* Domains */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Domains ({form.domainIds.length} selected)
            </p>
            {domains.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No domains tracked yet. Add domains on the Domains page first.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {domains.map((d) => {
                  const sel = form.domainIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDomain(d.id)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm transition-all text-left',
                        sel ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        sel ? 'border-blue-600 bg-blue-600' : 'border-slate-300',
                      )}>
                        {sel && <Check size={10} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn('font-semibold truncate', sel ? 'text-blue-700' : 'text-slate-800')}>{d.name}</p>
                        <p className="text-xs text-slate-500 truncate">{d.registrar}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Emails */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Email Accounts ({form.emailIds.length} selected)
            </p>
            {emailAccounts.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No email accounts tracked yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {emailAccounts.map((e) => {
                  const sel = form.emailIds.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => toggleEmail(e.id)}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm transition-all text-left',
                        sel ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        sel ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300',
                      )}>
                        {sel && <Check size={10} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className={cn('font-semibold truncate', sel ? 'text-indigo-700' : 'text-slate-800')}>{e.emailAddress}</p>
                        <p className="text-xs text-slate-500 truncate">{e.domainName}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Section 7: Notes & Tags */}
      <SectionCard title="Notes & Tags" icon={FileText} defaultOpen={false}>
        <div className="space-y-4">
          <Textarea
            label="Notes"
            rows={4}
            placeholder="Project notes, special requirements, client preferences…"
            value={form.notes}
            onChange={(e) => f('notes', e.target.value)}
          />
          <Input
            label="Tags"
            placeholder="wordpress, ecommerce, rush-job"
            hint="Comma-separated"
            value={form.tags}
            onChange={(e) => f('tags', e.target.value)}
          />
        </div>
      </SectionCard>

      {/* Submit row */}
      <div className="flex gap-3 pt-2 pb-8">
        <Button type="submit" variant="primary" size="lg" loading={saving} className="min-w-[160px]">
          {isEdit ? 'Save Changes' : 'Create Project'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => navigate('/webdev/projects')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
