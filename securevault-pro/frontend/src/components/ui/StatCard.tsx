import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  gradient?: string;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  className?: string;
  index?: number;
  action?: ReactNode;
}

const GLOW: Record<string, string> = {
  'stat-blue':    '0 8px 32px rgba(37,99,235,0.38), 0 2px 8px rgba(37,99,235,0.18)',
  'stat-indigo':  '0 8px 32px rgba(99,102,241,0.38), 0 2px 8px rgba(99,102,241,0.18)',
  'stat-emerald': '0 8px 32px rgba(16,185,129,0.38), 0 2px 8px rgba(16,185,129,0.18)',
  'stat-violet':  '0 8px 32px rgba(124,58,237,0.38), 0 2px 8px rgba(124,58,237,0.18)',
  'stat-amber':   '0 8px 32px rgba(245,158,11,0.38), 0 2px 8px rgba(245,158,11,0.18)',
  'stat-rose':    '0 8px 32px rgba(244,63,94,0.38),  0 2px 8px rgba(244,63,94,0.18)',
  'stat-cyan':    '0 8px 32px rgba(6,182,212,0.38),  0 2px 8px rgba(6,182,212,0.18)',
};

export function StatCard({
  title, value, subtitle, icon: Icon, gradient = 'stat-blue',
  trend, trendLabel, loading, className, index = 0, action,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-300 to-slate-400 p-5 overflow-hidden relative h-[140px]">
        <div className="animate-pulse space-y-3">
          <div className="flex justify-between items-start">
            <div className="h-3 bg-white/40 rounded-full w-20" />
            <div className="h-12 w-12 bg-white/30 rounded-2xl" />
          </div>
          <div className="h-9 bg-white/40 rounded-lg w-32 mt-3" />
          <div className="h-3 bg-white/30 rounded-full w-24" />
        </div>
      </div>
    );
  }

  const glow = GLOW[gradient] ?? GLOW['stat-blue'];
  const isUp   = trend !== undefined && trend > 0;
  const isDown = trend !== undefined && trend < 0;
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 text-white cursor-default select-none',
        'hover:-translate-y-1 transition-transform duration-200',
        gradient,
        className,
      )}
      style={{ boxShadow: glow }}
    >
      {/* Top-right glow orb */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      {/* Bottom-left depth shadow */}
      <div className="absolute -bottom-8 -left-6 w-32 h-32 bg-black/15 rounded-full blur-2xl pointer-events-none" />
      {/* Subtle mesh pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      {/* Shimmer line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-[11px] font-bold text-white/65 uppercase tracking-[0.12em] leading-none pt-0.5">
            {title}
          </p>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <Icon size={22} className="text-white drop-shadow-sm" />
          </div>
        </div>

        {/* Value */}
        <p className="text-[2.1rem] font-black text-white leading-none mb-2.5 tracking-tight drop-shadow-sm">
          {value}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between min-h-[22px]">
          {subtitle && (
            <p className="text-[11px] text-white/58 leading-snug font-medium">{subtitle}</p>
          )}
          {!subtitle && <span />}

          {trend !== undefined && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-sm text-white text-[11px] font-bold border border-white/10 flex-shrink-0">
              <TrendIcon size={11} />
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trendLabel && <span className="font-normal opacity-70 ml-0.5">{trendLabel}</span>}
            </div>
          )}
        </div>

        {action && <div className="mt-3">{action}</div>}
      </div>
    </motion.div>
  );
}
