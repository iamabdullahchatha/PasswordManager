import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, Edit2, Trash2, User, Mail, Phone, Building2,
  Globe, Link as LinkIcon, Calendar, DollarSign, TrendingUp, TrendingDown,
  ExternalLink, Globe2, Server, Check, ArrowLeft, Code, Clock,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useWebDevStore } from '../../store/webdevStore';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES,
  SERVICE_LABELS, calcTotalCost, calcProfit, calcProfitMargin,
  getDaysUntilExpiry, getExpiryVariant, EXPIRY_STYLES, formatDaysLabel,
  REGISTRAR_LABELS, EMAIL_PROVIDER_LABELS,
} from '../../utils/webdev';
import { toast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ComponentType<any> }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-slate-50 last:border-0">
      {Icon && <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-sm text-slate-900 font-semibold mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

function CostRow({ label, value, currency, accent = false }: { label: string; value: number; currency: string; accent?: boolean }) {
  if (value === 0) return null;
  return (
    <div className={cn('flex items-center justify-between py-2 border-b border-slate-50 last:border-0', accent && 'bg-slate-50 -mx-4 px-4 rounded-lg')}>
      <span className={cn('text-sm', accent ? 'font-bold text-slate-900' : 'text-slate-600')}>{label}</span>
      <span className={cn('text-sm font-semibold tabular-nums', accent ? 'text-slate-900 text-base font-black' : 'text-slate-900')}>
        {formatCurrency(value, currency)}
      </span>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, domains, emailAccounts, deleteProject } = useWebDevStore();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const project = projects.find((p) => p.id === id);
  const linkedDomains = useMemo(() => domains.filter((d) => project?.domainIds.includes(d.id)), [domains, project]);
  const linkedEmails = useMemo(() => emailAccounts.filter((e) => project?.emailIds.includes(e.id)), [emailAccounts, project]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-slate-500">Project not found.</p>
        <Link to="/webdev/projects"><Button variant="outline" leftIcon={ArrowLeft}>Back to Projects</Button></Link>
      </div>
    );
  }

  const totalCost = calcTotalCost(project);
  const profit = calcProfit(project.clientCharged, totalCost);
  const margin = calcProfitMargin(project.clientCharged, totalCost);
  const isProfit = profit >= 0;

  const handleDelete = () => {
    setDeleting(true);
    deleteProject(project.id);
    toast('Project deleted', 'success');
    navigate('/webdev/projects', { replace: true });
  };

  const fade = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: i * 0.06, duration: 0.35 },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.clientCompany ? `${project.clientName} · ${project.clientCompany}` : project.clientName}
        icon={Briefcase}
        breadcrumb={['Web Developer', 'Projects', project.name]}
        badge={
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', PROJECT_STATUS_STYLES[project.status])}>
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
        }
        action={
          <div className="flex gap-2">
            <Link to={`/webdev/projects/${project.id}/edit`}>
              <Button variant="outline" size="sm" leftIcon={Edit2}>Edit</Button>
            </Link>
            <Button variant="destructive" size="sm" leftIcon={Trash2} onClick={() => setShowDelete(true)}>Delete</Button>
          </div>
        }
      />

      {/* Profit banner */}
      <motion.div
        {...fade(0)}
        className={cn(
          'rounded-2xl border-2 p-5',
          isProfit ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50' : 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-8">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Charged to Client</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(project.clientCharged, project.currency)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Costs</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalCost, project.currency)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isProfit ? 'Profit' : 'Loss'}
            </p>
            <div className={cn('flex items-center gap-2 mt-1', isProfit ? 'text-emerald-700' : 'text-red-700')}>
              {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <span className="text-2xl font-black">{formatCurrency(Math.abs(profit), project.currency)}</span>
              <span className="text-base font-bold">({margin.toFixed(0)}%)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-semibold px-3 py-1.5 rounded-full', PAYMENT_STATUS_STYLES[project.paymentStatus])}>
              {PAYMENT_STATUS_LABELS[project.paymentStatus]}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Three-column info grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Client card */}
        <motion.div {...fade(1)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <User size={15} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Client</h3>
          </div>
          <InfoRow label="Name" value={project.clientName} icon={User} />
          <InfoRow label="Company" value={project.clientCompany} icon={Building2} />
          <InfoRow label="Email" value={project.clientEmail} icon={Mail} />
          <InfoRow label="Phone" value={project.clientPhone} icon={Phone} />
        </motion.div>

        {/* Project URLs card */}
        <motion.div {...fade(2)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Globe size={15} className="text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">URLs</h3>
          </div>
          {project.liveUrl ? (
            <div className="py-2.5 border-b border-slate-50">
              <p className="text-xs text-slate-500 font-medium">Live Site</p>
              <a href={project.liveUrl} target="_blank" rel="noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1.5 mt-0.5 break-all">
                {project.liveUrl.replace(/^https?:\/\//, '')} <ExternalLink size={11} />
              </a>
            </div>
          ) : null}
          {project.stagingUrl ? (
            <div className="py-2.5 border-b border-slate-50">
              <p className="text-xs text-slate-500 font-medium">Staging</p>
              <a href={project.stagingUrl} target="_blank" rel="noreferrer"
                className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1.5 mt-0.5 break-all">
                {project.stagingUrl.replace(/^https?:\/\//, '')} <ExternalLink size={11} />
              </a>
            </div>
          ) : null}
          {project.repositoryUrl ? (
            <div className="py-2.5">
              <p className="text-xs text-slate-500 font-medium">Repository</p>
              <a href={project.repositoryUrl} target="_blank" rel="noreferrer"
                className="text-sm text-slate-700 hover:text-slate-900 font-semibold flex items-center gap-1.5 mt-0.5 break-all">
                <Code size={11} />{project.repositoryUrl.replace(/^https?:\/\//, '')} <ExternalLink size={11} />
              </a>
            </div>
          ) : null}
          {!project.liveUrl && !project.stagingUrl && !project.repositoryUrl && (
            <p className="text-sm text-slate-400 italic">No URLs added</p>
          )}
        </motion.div>

        {/* Timeline card */}
        <motion.div {...fade(3)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar size={15} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
          </div>
          <InfoRow label="Start Date" value={project.startDate ? formatDate(project.startDate) : null} icon={Calendar} />
          <InfoRow label="End Date" value={project.endDate ? formatDate(project.endDate) : null} icon={Calendar} />
          <InfoRow label="Invoice Date" value={project.invoiceDate ? formatDate(project.invoiceDate) : null} icon={DollarSign} />
          <InfoRow label="Due Date" value={project.dueDate ? formatDate(project.dueDate) : null} icon={Clock} />
          {!project.startDate && !project.endDate && !project.invoiceDate && (
            <p className="text-sm text-slate-400 italic">No dates set</p>
          )}
        </motion.div>
      </div>

      {/* Services */}
      {project.services.length > 0 && (
        <motion.div {...fade(4)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Server size={15} className="text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Services Delivered</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.services.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                <Check size={12} />{SERVICE_LABELS[s]}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Financial breakdown + Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cost breakdown */}
        <motion.div {...fade(5)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign size={15} className="text-amber-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Cost Breakdown</h3>
          </div>
          <div className="space-y-0">
            <CostRow label="Domain Registration" value={project.domainCost} currency={project.currency} />
            <CostRow label="Email Hosting" value={project.emailCost} currency={project.currency} />
            <CostRow label="Web Hosting" value={project.hostingCost} currency={project.currency} />
            <CostRow label="Design" value={project.designCost} currency={project.currency} />
            <CostRow label="Development" value={project.developmentCost} currency={project.currency} />
            <CostRow label="Maintenance" value={project.maintenanceCost} currency={project.currency} />
            <CostRow label="Other" value={project.otherCost} currency={project.currency} />
            {totalCost > 0 && (
              <div className="pt-3 mt-2 border-t border-slate-200">
                <CostRow label="Total Cost" value={totalCost} currency={project.currency} accent />
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-bold text-slate-700">Net {isProfit ? 'Profit' : 'Loss'}</span>
                  <span className={cn('text-base font-black', isProfit ? 'text-emerald-600' : 'text-red-600')}>
                    {isProfit ? '+' : ''}{formatCurrency(profit, project.currency)}
                  </span>
                </div>
              </div>
            )}
            {totalCost === 0 && <p className="text-sm text-slate-400 italic">No costs recorded</p>}
          </div>
        </motion.div>

        {/* Linked resources */}
        <motion.div {...fade(6)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Globe2 size={15} className="text-cyan-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Linked Resources</h3>
          </div>

          {/* Domains */}
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Domains ({linkedDomains.length})
            </p>
            {linkedDomains.length === 0 ? (
              <p className="text-xs text-slate-400 italic">None linked</p>
            ) : (
              <div className="space-y-2">
                {linkedDomains.map((d) => {
                  const days = getDaysUntilExpiry(d.expiryDate);
                  const style = EXPIRY_STYLES[getExpiryVariant(days)];
                  return (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{d.name}</p>
                        <p className="text-xs text-slate-500">{REGISTRAR_LABELS[d.registrar]} · {formatDate(d.expiryDate)}</p>
                      </div>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', style.pill)}>
                        {formatDaysLabel(days)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Emails */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Email Accounts ({linkedEmails.length})
            </p>
            {linkedEmails.length === 0 ? (
              <p className="text-xs text-slate-400 italic">None linked</p>
            ) : (
              <div className="space-y-2">
                {linkedEmails.map((e) => (
                  <div key={e.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{e.emailAddress}</p>
                      <p className="text-xs text-slate-500">{EMAIL_PROVIDER_LABELS[e.provider]} · {e.seats} seat{e.seats !== 1 ? 's' : ''}</p>
                    </div>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      e.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200',
                    )}>
                      {e.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Notes */}
      {project.notes && (
        <motion.div {...fade(7)} className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <LinkIcon size={15} className="text-slate-500" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Notes</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{project.notes}</p>
        </motion.div>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <motion.div {...fade(8)} className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags:</span>
          {project.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </motion.div>
      )}

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Permanently delete "${project.name}"? This action cannot be undone.`}
        confirmLabel="Delete Project"
        variant="destructive"
        loading={deleting}
        icon={Trash2}
      />
    </div>
  );
}
