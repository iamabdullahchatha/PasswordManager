import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase, Plus, Search, Edit2, Trash2, Eye, Globe, Mail,
  TrendingUp, TrendingDown, ExternalLink, User, Building2,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useWebDevStore } from '../../store/webdevStore';
import { formatCurrency } from '../../utils/format';
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES,
  SERVICE_LABELS, calcTotalCost, calcProfit, calcProfitMargin,
} from '../../utils/webdev';
import { toast } from '../../hooks/useToast';
import { cn } from '../../utils/cn';
import type { ProjectStatus, WebProject } from '../../types';

type FilterTab = 'ALL' | ProjectStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'PAUSED', label: 'Paused' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function ProjectsPage() {
  const { projects, domains, emailAccounts, deleteProject } = useWebDevStore();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<FilterTab>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<WebProject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: projects.length };
    (['ACTIVE', 'COMPLETED', 'PAUSED', 'ON_HOLD', 'CANCELLED'] as ProjectStatus[]).forEach(
      (s) => { c[s] = projects.filter((p) => p.status === s).length; },
    );
    return c;
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (tab !== 'ALL') list = list.filter((p) => p.status === tab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          (p.clientCompany ?? '').toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [projects, tab, search]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    deleteProject(deleteTarget.id);
    toast('Project deleted', 'success');
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Track client projects, services delivered, and profitability"
        icon={Briefcase}
        action={
          <Link to="/webdev/projects/new">
            <Button variant="primary" size="sm" leftIcon={Plus}>New Project</Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or clients…"
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap',
                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {t.label}
              <span className={cn(
                'ml-1.5 text-2xs font-bold px-1.5 py-0.5 rounded-full',
                tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500',
              )}>
                {counts[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={search ? 'No matching projects' : 'No projects yet'}
          description={search ? 'Try a different search term' : 'Create your first project to start tracking client work and billing'}
          action={
            !search ? (
              <Link to="/webdev/projects/new">
                <Button variant="primary" leftIcon={Plus}>New Project</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project, i) => {
            const totalCost = calcTotalCost(project);
            const profit = calcProfit(project.clientCharged, totalCost);
            const margin = calcProfitMargin(project.clientCharged, totalCost);
            const isProfit = profit >= 0;
            const linkedDomains = domains.filter((d) => project.domainIds.includes(d.id));
            const linkedEmails = emailAccounts.filter((e) => project.emailIds.includes(e.id));

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
              >
                {/* Card header */}
                <div className="px-5 pt-4 pb-3 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={`/webdev/projects/${project.id}`}>
                          <h3 className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors truncate">
                            {project.name}
                          </h3>
                        </Link>
                        <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0', PROJECT_STATUS_STYLES[project.status])}>
                          {PROJECT_STATUS_LABELS[project.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        <User size={11} />
                        <span className="truncate">{project.clientName}</span>
                        {project.clientCompany && (
                          <>
                            <span className="text-slate-300">·</span>
                            <Building2 size={11} />
                            <span className="truncate">{project.clientCompany}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-3 flex-1 space-y-3">
                  {/* Services */}
                  {project.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.services.slice(0, 4).map((s) => (
                        <span key={s} className="text-2xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          {SERVICE_LABELS[s]}
                        </span>
                      ))}
                      {project.services.length > 4 && (
                        <span className="text-2xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          +{project.services.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Links */}
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium truncate"
                    >
                      <ExternalLink size={11} />
                      {project.liveUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}

                  {/* Resources */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Globe size={11} />{linkedDomains.length} domain{linkedDomains.length !== 1 ? 's' : ''}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <Mail size={11} />{linkedEmails.length} email{linkedEmails.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Financial footer */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-slate-500">Charged</p>
                      <p className="text-base font-black text-slate-900">{formatCurrency(project.clientCharged, project.currency)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Profit</p>
                      <p className={cn('text-base font-black flex items-center gap-1', isProfit ? 'text-emerald-600' : 'text-red-600')}>
                        {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isProfit ? '+' : ''}{formatCurrency(profit, project.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Margin</p>
                      <p className={cn('text-base font-black', isProfit ? 'text-emerald-600' : 'text-red-600')}>
                        {margin.toFixed(0)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', PAYMENT_STATUS_STYLES[project.paymentStatus])}>
                      {PAYMENT_STATUS_LABELS[project.paymentStatus]}
                    </span>
                    <div className="flex gap-1">
                      <Link to={`/webdev/projects/${project.id}`}>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                          <Eye size={13} />
                        </button>
                      </Link>
                      <Link to={`/webdev/projects/${project.id}/edit`}>
                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                          <Edit2 size={13} />
                        </button>
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Permanently delete "${deleteTarget?.name}"? All linked data will be unlinked.`}
        confirmLabel="Delete Project"
        variant="destructive"
        loading={deleting}
        icon={Trash2}
      />
    </div>
  );
}
