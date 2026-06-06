import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Globe, AlertTriangle, Briefcase, DollarSign, Plus, ArrowRight,
  Clock, CheckCircle2, TrendingUp, Mail, ExternalLink, RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useWebDevStore } from '../../store/webdevStore';
import { useCurrencyStore } from '../../store/currencyStore';
import { formatCurrency, formatDate } from '../../utils/format';
import {
  getDaysUntilExpiry, getExpiryVariant, EXPIRY_STYLES, formatDaysLabel,
  PROJECT_STATUS_LABELS, PROJECT_STATUS_STYLES, calcTotalCost, calcProfit,
  REGISTRAR_LABELS,
} from '../../utils/webdev';
import { cn } from '../../utils/cn';

const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] },
});

export default function WebDevDashboard() {
  const { domains, emailAccounts, projects } = useWebDevStore();
  const { currency } = useCurrencyStore();
  const fmt = (n: number) => formatCurrency(n, currency);

  const stats = useMemo(() => {
    const now = new Date();
    const expiring = domains.filter((d) => {
      const days = getDaysUntilExpiry(d.expiryDate);
      return days >= 0 && days <= 30;
    });
    const expired = domains.filter((d) => getDaysUntilExpiry(d.expiryDate) < 0);
    const activeProjects = projects.filter((p) => p.status === 'ACTIVE');
    const totalRevenue = projects.reduce((sum, p) => sum + p.clientCharged, 0);
    const totalCosts = projects.reduce((sum, p) => sum + calcTotalCost(p), 0);
    return { expiring, expired, activeProjects, totalRevenue, totalCosts, now };
  }, [domains, projects]);

  const upcomingRenewals = useMemo(() =>
    [...domains]
      .filter((d) => getDaysUntilExpiry(d.expiryDate) > -90)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      .slice(0, 8),
    [domains],
  );

  const recentProjects = useMemo(() =>
    [...projects]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
    [projects],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Web Developer"
        description="Track domains, email hosting and client projects in one place"
        icon={Globe}
        gradient
        action={
          <div className="flex gap-2">
            <Link to="/webdev/domains"><Button variant="outline" size="sm" leftIcon={Globe}>Add Domain</Button></Link>
            <Link to="/webdev/projects/new"><Button variant="primary" size="sm" leftIcon={Plus}>New Project</Button></Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Domains"
          value={domains.length}
          subtitle={`${emailAccounts.length} email account${emailAccounts.length !== 1 ? 's' : ''}`}
          icon={Globe}
          gradient="stat-blue"
          index={0}
        />
        <StatCard
          title="Expiring Soon"
          value={stats.expiring.length + stats.expired.length}
          subtitle={stats.expired.length > 0 ? `${stats.expired.length} already expired` : 'within 30 days'}
          icon={AlertTriangle}
          gradient={stats.expiring.length + stats.expired.length > 0 ? 'stat-rose' : 'stat-emerald'}
          index={1}
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects.length}
          subtitle={`${projects.length} total project${projects.length !== 1 ? 's' : ''}`}
          icon={Briefcase}
          gradient="stat-indigo"
          index={2}
        />
        <StatCard
          title="Total Revenue"
          value={fmt(stats.totalRevenue)}
          subtitle={`Profit: ${fmt(calcProfit(stats.totalRevenue, stats.totalCosts))}`}
          icon={DollarSign}
          gradient="stat-emerald"
          index={3}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Domain expiry timeline */}
        <motion.div {...fade(4)} className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Domain Renewal Timeline</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upcoming & recent expirations</p>
            </div>
            <Link to="/webdev/domains">
              <Button variant="ghost" size="xs" rightIcon={ArrowRight}>All Domains</Button>
            </Link>
          </div>

          {upcomingRenewals.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="No domains tracked"
              description="Add your first domain to monitor its expiry date"
              size="sm"
              action={<Link to="/webdev/domains"><Button variant="primary" size="sm" leftIcon={Plus}>Add Domain</Button></Link>}
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {upcomingRenewals.map((domain, i) => {
                const days = getDaysUntilExpiry(domain.expiryDate);
                const variant = getExpiryVariant(days);
                const style = EXPIRY_STYLES[variant];
                const linkedProject = domain.projectId
                  ? projects.find((p) => p.id === domain.projectId)
                  : null;
                return (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.2 }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', style.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">{domain.name}</span>
                        {domain.autoRenew && (
                          <span className="inline-flex items-center gap-1 text-2xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                            <RefreshCw size={9} />Auto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-500">{REGISTRAR_LABELS[domain.registrar]}</span>
                        {linkedProject && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-blue-600 truncate">{linkedProject.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500">{formatDate(domain.expiryDate)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(domain.costPerYear, domain.currency)}/yr</p>
                      </div>
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap', style.pill)}>
                        {formatDaysLabel(days)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Recent Projects */}
        <motion.div {...fade(5)} className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Projects</h2>
              <p className="text-xs text-slate-500 mt-0.5">Client projects overview</p>
            </div>
            <Link to="/webdev/projects">
              <Button variant="ghost" size="xs" rightIcon={ArrowRight}>All</Button>
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No projects yet"
              description="Create a project to track client billing and services"
              size="sm"
              action={<Link to="/webdev/projects/new"><Button variant="primary" size="sm" leftIcon={Plus}>New Project</Button></Link>}
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {recentProjects.map((project, i) => {
                const totalCost = calcTotalCost(project);
                const profit = calcProfit(project.clientCharged, totalCost);
                const isProfit = profit >= 0;
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i + 0.2 }}
                    className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/webdev/projects/${project.id}`}>
                          <span className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate block">
                            {project.name}
                          </span>
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{project.clientName}</p>
                      </div>
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0', PROJECT_STATUS_STYLES[project.status])}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-400">
                        Charged: <span className="text-slate-700 font-medium">{formatCurrency(project.clientCharged, project.currency)}</span>
                      </span>
                      <span className={cn('text-xs font-semibold', isProfit ? 'text-emerald-600' : 'text-red-600')}>
                        {isProfit ? '+' : ''}{formatCurrency(profit, project.currency)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Domains Active', value: domains.filter((d) => getDaysUntilExpiry(d.expiryDate) > 0).length, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Email Accounts', value: emailAccounts.filter((e) => e.isActive).length, icon: Mail, color: 'text-blue-600 bg-blue-50' },
          { label: 'Completed Projects', value: projects.filter((p) => p.status === 'COMPLETED').length, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Pending Payments', value: projects.filter((p) => p.paymentStatus === 'PENDING' || p.paymentStatus === 'OVERDUE').length, icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map((item, i) => (
          <motion.div key={item.label} {...fade(i + 6)} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', item.color)}>
                <item.icon size={16} />
              </div>
              <div>
                <p className="text-xl font-black text-slate-900">{item.value}</p>
                <p className="text-xs text-slate-500 leading-tight">{item.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
