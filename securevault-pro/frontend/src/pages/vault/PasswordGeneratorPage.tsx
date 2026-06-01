import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Copy, Check, Shield, Key, History, Sliders, Lock } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { generatePassword } from '../../utils/password';
import { cn } from '../../utils/cn';

type Options = {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};

const DEFAULT: Options = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

interface ToggleOption {
  key: keyof Options;
  label: string;
  description: string;
  example: string;
}

const TOGGLE_OPTIONS: ToggleOption[] = [
  { key: 'uppercase',        label: 'Uppercase Letters',  description: 'A–Z',                    example: 'A B C' },
  { key: 'lowercase',        label: 'Lowercase Letters',  description: 'a–z',                    example: 'a b c' },
  { key: 'numbers',          label: 'Numbers',            description: '0–9',                    example: '1 2 3' },
  { key: 'symbols',          label: 'Special Characters', description: '!@#$%^&*…',              example: '! @ #' },
  { key: 'excludeAmbiguous', label: 'Exclude Ambiguous',  description: 'Remove I, l, O, 0, etc', example: 'cleaner' },
];

export default function PasswordGeneratorPage() {
  const [options, setOptions]   = useState<Options>(DEFAULT);
  const [password, setPassword] = useState('');
  const [copied, setCopied]     = useState(false);
  const [history, setHistory]   = useState<string[]>([]);

  const generate = useCallback(() => {
    const pwd = generatePassword(options);
    setPassword(pwd);
    setHistory((prev) => [pwd, ...prev.filter((p) => p !== pwd)].slice(0, 6));
    setCopied(false);
  }, [options]);

  useEffect(() => { generate(); }, []);

  const handleCopy = async (value?: string) => {
    const target = value ?? password;
    await navigator.clipboard.writeText(target);
    if (!value) setCopied(true);
    // Auto-clear clipboard
    setTimeout(async () => {
      try {
        const t = await navigator.clipboard.readText();
        if (t === target) await navigator.clipboard.writeText('');
      } catch {}
    }, 30_000);
    if (!value) setTimeout(() => setCopied(false), 2000);
  };

  const toggle = (key: keyof Options) => {
    setOptions((p) => {
      const next = { ...p, [key]: !p[key] };
      const anyCharType = next.uppercase || next.lowercase || next.numbers || next.symbols;
      return anyCharType ? next : p;
    });
  };

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="Password Generator"
        description="Create cryptographically strong passwords"
        icon={Key}
      />

      {/* ── Generated Password Card ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Generated Password</p>
              <p className="text-xs text-blue-200">{options.length} characters</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy()}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/20',
              )}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1">
                    <Check size={12} /> Copied!
                  </motion.span>
                ) : (
                  <motion.span key="copy" className="flex items-center gap-1">
                    <Copy size={12} /> Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              onClick={generate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 border border-white/20 text-white text-xs font-semibold transition-all"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* Password display */}
        <div className="p-6">
          <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-5 mb-4 group">
            <p className="font-mono text-lg tracking-wider break-all text-slate-900 select-all leading-relaxed pr-2">
              {password}
            </p>
          </div>
          <PasswordStrength password={password} showFeedback={false} />

          <Button
            variant="primary"
            leftIcon={RefreshCw}
            onClick={generate}
            className="w-full mt-5"
            size="lg"
          >
            Generate New Password
          </Button>
        </div>
      </motion.div>

      {/* ── Options Card ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-card p-6"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Sliders size={15} className="text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Options</p>
        </div>

        {/* Length slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Password Length</label>
            <span className="text-lg font-extrabold text-blue-600 tabular-nums">{options.length}</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={8}
              max={64}
              value={options.length}
              onChange={(e) => setOptions((p) => ({ ...p, length: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-100"
              style={{
                background: `linear-gradient(to right, #2563EB 0%, #2563EB ${((options.length - 8) / (64 - 8)) * 100}%, #F1F5F9 ${((options.length - 8) / (64 - 8)) * 100}%, #F1F5F9 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>8 chars</span>
            <span className={cn(options.length >= 20 ? 'text-emerald-600 font-medium' : '')}>
              {options.length >= 20 ? '✓ Recommended' : `+${20 - options.length} for recommended`}
            </span>
            <span>64 chars</span>
          </div>
        </div>

        {/* Character options */}
        <div className="space-y-2">
          {TOGGLE_OPTIONS.map(({ key, label, description, example }) => (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={cn(
                'w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all',
                (options[key] as boolean)
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50',
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all',
                  (options[key] as boolean)
                    ? 'bg-blue-600'
                    : 'border-2 border-slate-300',
                )}>
                  {(options[key] as boolean) && (
                    <svg viewBox="0 0 10 10" fill="none" className="w-3 h-3">
                      <path d="M2 5L4 7.5L8 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={cn('text-sm font-semibold', (options[key] as boolean) ? 'text-blue-900' : 'text-slate-700')}>
                    {label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
              </div>
              <span className={cn(
                'text-xs font-mono px-2 py-0.5 rounded-md flex-shrink-0',
                (options[key] as boolean) ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500',
              )}>
                {example}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── History ───────────────────────────────────────────────────── */}
      {history.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-card p-6"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <History size={15} className="text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Recent Passwords</p>
            <span className="ml-auto text-xs text-slate-400">Hover to copy</span>
          </div>
          <div className="space-y-2">
            {history.slice(1).map((pwd, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all group"
              >
                <Lock size={13} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0 transition-colors" />
                <p className="font-mono text-xs text-slate-500 group-hover:text-blue-700 truncate flex-1 transition-colors">
                  {pwd}
                </p>
                <button
                  onClick={() => handleCopy(pwd)}
                  className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Copy size={12} />
                </button>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
            <Lock size={10} /> History is local and clears when you navigate away
          </p>
        </motion.div>
      )}
    </div>
  );
}
