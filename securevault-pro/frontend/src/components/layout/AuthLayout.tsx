import { ReactNode } from 'react';
import { Shield, Lock, BarChart3, Users, CheckCircle, TrendingUp } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

const FEATURES = [
  { icon: Lock,      title: 'AES-256-GCM Encryption',  desc: 'Military-grade encryption for every stored credential' },
  { icon: BarChart3, title: 'Expense Analytics',         desc: 'Track, visualize, and control your spending patterns' },
  { icon: Users,     title: 'Role-Based Access',         desc: 'Granular permissions — admin, manager, or user roles' },
];

const STATS = [
  { value: '256-bit', label: 'Encryption' },
  { value: '100%',    label: 'Secure' },
  { value: '∞',       label: 'Entries' },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* ── Left Panel — Brand ───────────────────────────────────────────── */}
      <div className="hidden lg:flex w-[520px] flex-shrink-0 flex-col relative overflow-hidden
                      bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Background pattern */}
        <div className="absolute inset-0 pattern-grid opacity-30" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-56 h-56 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-3/4 left-1/2 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-blue">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <p className="text-base font-extrabold text-white leading-none tracking-tight">SecureVault Pro</p>
              <p className="text-xs text-blue-300/70 mt-0.5">Enterprise Security Platform</p>
            </div>
          </div>

          {/* Hero */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/20 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-blue-300 font-medium">Trusted by security professionals</span>
              </div>

              <h1 className="text-5xl font-black text-white leading-[1.1] mb-5">
                Your Digital Life,
                <br />
                <span className="text-gradient-blue">Secured.</span>
              </h1>
              <p className="text-blue-200/60 text-base leading-relaxed max-w-sm">
                Professional password vault and expense management with enterprise-grade security architecture.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 mb-10">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-blue-300/50 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Feature list */}
            <div className="space-y-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-blue-200/50 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                  <CheckCircle size={14} className="text-emerald-400/60 flex-shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-xs text-blue-300/30">
            <Lock size={11} />
            <span>End-to-end encrypted · Zero knowledge architecture</span>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-6 min-h-screen">
        <div className="w-full max-w-[420px] flex-1 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-blue-sm">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-slate-900">SecureVault Pro</span>
          </div>
          {children}
        </div>

        {/* ── Powered by Webcore Solutions ─────────────────────────────── */}
        <div className="w-full max-w-[420px] mt-8 pt-5 border-t border-slate-200/70 text-center">
          <p className="text-[11px] text-slate-400 font-medium mb-1.5 tracking-wide uppercase">Powered by</p>
          <p className="text-sm font-bold text-slate-700 mb-1">Webcore Solutions UAE</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="https://www.webcoreuae.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium"
            >
              www.webcoreuae.com
            </a>
            <span className="text-slate-300 text-xs">·</span>
            <a
              href="mailto:info@webcoreuae.com"
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors font-medium"
            >
              info@webcoreuae.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
