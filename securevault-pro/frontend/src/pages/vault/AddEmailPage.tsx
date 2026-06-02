import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Globe, Mail, Tag, RefreshCw, Key, Lock, Phone,
  Star, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp,
  Hash, HelpCircle, Smartphone, Eye, EyeOff,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { Badge } from '../../components/ui/Badge';
import { vaultService } from '../../services/vault.service';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { generatePassword } from '../../utils/password';
import { PROVIDER_LABELS, PROVIDER_GROUPS } from '../../components/vault/ProviderIcon';
import { cn } from '../../utils/cn';
import type { EmailProvider, ImportanceLevel } from '../../types';

// PROVIDER_GROUPS imported from ProviderIcon — grouped for the dropdown
const IMPORTANCE_OPTS: { value: ImportanceLevel; label: string; desc: string }[] = [
  { value: 'LOW',      label: 'Low',      desc: 'Personal / secondary accounts'         },
  { value: 'MEDIUM',   label: 'Medium',   desc: 'Regularly used accounts'               },
  { value: 'HIGH',     label: 'High',     desc: 'Important accounts with sensitive data' },
  { value: 'CRITICAL', label: 'Critical', desc: 'Financial, work, primary accounts'      },
];

const schema = z.object({
  title:           z.string().min(1,'Title is required').max(100),
  platformName:    z.string().min(1).max(100),
  provider:        z.enum([
    'GMAIL','OUTLOOK','YAHOO','ZOHO','ICLOUD','PROTONMAIL','FASTMAIL','BUSINESS',
    'FACEBOOK','INSTAGRAM','WHATSAPP','SNAPCHAT','TWITTER','TIKTOK','YOUTUBE',
    'LINKEDIN','DISCORD','TELEGRAM','REDDIT','PINTEREST','TWITCH',
    'BINANCE','PAYPAL','COINBASE',
    'GITHUB','GOOGLE','APPLE','MICROSOFT','AMAZON','NETFLIX','SPOTIFY','SHOPIFY','STEAM',
    'CUSTOM',
  ]).default('CUSTOM'),
  platformUrl:     z.string().url('Invalid URL').optional().or(z.literal('')),
  emailAddress:    z.string().min(1,'Email, phone, or username is required'),
  username:        z.string().max(100).optional(),
  password:        z.string().min(1,'Password is required'),
  notes:           z.string().max(10000).optional(),
  recoveryEmail:   z.string().email('Invalid email').optional().or(z.literal('')),
  recoveryPhone:   z.string().max(30).optional(),
  twoFactorEnabled:    z.boolean().optional().default(false),
  authenticatorApp:    z.string().max(100).optional(),
  backupCodes:         z.string().max(5000).optional(),
  appPasswords:        z.string().max(5000).optional(),
  securityQuestions:   z.string().max(5000).optional(),
  category:            z.string().max(50).optional(),
  importanceLevel:     z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).default('MEDIUM'),
  isFavorite:          z.boolean().optional().default(false),
  tags:                z.string().optional(),
  lastPasswordChangedAt:  z.string().optional(),
  nextPasswordReminderAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const iCls = 'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300';
const selectCls = `${iCls} appearance-none`;

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-slate-900 flex-1 text-left">{title}</p>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </div>
  );
}

function Field({ label, error, required: req, hint, children }: {
  label: string; error?: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label}{req && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function AddEmailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = !!id;
  const [showPwd, setShowPwd] = useState(false);

  const {
    register, handleSubmit, watch, setValue, control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: 'CUSTOM', importanceLevel: 'MEDIUM',
      isFavorite: false, twoFactorEnabled: false,
    },
  });

  const pwd       = watch('password', '');
  const provider  = watch('provider');
  const hasTwoFa  = watch('twoFactorEnabled');

  /* Auto-fill platformName from provider */
  useEffect(() => {
    if (!isEdit && provider !== 'CUSTOM') {
      setValue('platformName', PROVIDER_LABELS[provider]);
      if (!watch('title')) setValue('title', `${PROVIDER_LABELS[provider]} Account`);
    }
  }, [provider]);

  /* Load entry in edit mode */
  useEffect(() => {
    if (isEdit && id) {
      vaultService.getById(id).then((res) => {
        const e = res.data;
        if (!e) return;
        setValue('title',           e.title);
        setValue('platformName',    e.platformName);
        setValue('provider',        e.provider);
        setValue('platformUrl',     e.platformUrl ?? '');
        setValue('emailAddress',    e.emailAddress);
        setValue('username',        e.username ?? '');
        setValue('category',        e.category ?? '');
        setValue('isFavorite',      e.isFavorite);
        setValue('twoFactorEnabled',e.twoFactorEnabled);
        setValue('authenticatorApp',e.authenticatorApp ?? '');
        setValue('recoveryEmail',   e.recoveryEmail ?? '');
        setValue('recoveryPhone',   e.recoveryPhone  ?? '');
        setValue('importanceLevel', e.importanceLevel);
        if (e.lastPasswordChangedAt)
          setValue('lastPasswordChangedAt', e.lastPasswordChangedAt.split('T')[0]);
        if (e.nextPasswordReminderAt)
          setValue('nextPasswordReminderAt', e.nextPasswordReminderAt.split('T')[0]);
        // Note: sensitive fields (backupCodes, appPasswords, securityQuestions) are not pre-filled
        // for security — user must re-enter to update them
      });
    }
  }, [id, isEdit]);

  const onSubmit = async (data: FormData) => {
    try {
      const tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const payload = {
        title:          data.title,
        platformName:   data.platformName,
        provider:       data.provider,
        platformUrl:    data.platformUrl  || undefined,
        emailAddress:   data.emailAddress,
        username:       data.username     || undefined,
        password:       data.password,
        notes:          data.notes        || undefined,
        recoveryEmail:  data.recoveryEmail|| undefined,
        recoveryPhone:  data.recoveryPhone|| undefined,
        twoFactorEnabled:  data.twoFactorEnabled,
        authenticatorApp:  data.authenticatorApp || undefined,
        backupCodes:       data.backupCodes      || undefined,
        appPasswords:      data.appPasswords     || undefined,
        securityQuestions: data.securityQuestions|| undefined,
        category:          data.category  || undefined,
        importanceLevel:   data.importanceLevel,
        isFavorite:        data.isFavorite,
        tags,
        lastPasswordChangedAt:  data.lastPasswordChangedAt  ? new Date(data.lastPasswordChangedAt).toISOString()  : undefined,
        nextPasswordReminderAt: data.nextPasswordReminderAt ? new Date(data.nextPasswordReminderAt).toISOString() : undefined,
      };

      if (isEdit && id) {
        await vaultService.update(id, payload);
        toast('Entry updated', 'success');
      } else {
        await vaultService.create(payload);
        toast('Entry saved securely', 'success');
      }
      navigate('/vault');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEdit ? 'Edit Vault Entry' : 'Add Vault Entry'}
        description="All sensitive data encrypted with AES-256-GCM"
        icon={Shield}
        breadcrumb={['Vault', isEdit ? 'Edit' : 'New Entry']}
      />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── Identity ─────────────────────────────────────────────── */}
            <Section title="Account Identity" icon={Shield}>
              <Field label="Account Title" error={errors.title?.message} required hint="e.g. Work Gmail, Personal Outlook">
                <input placeholder="e.g. Work Gmail" className={iCls} {...register('title')} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Platform / Provider" error={errors.provider?.message}>
                  <select className={selectCls} {...register('provider')}>
                    {PROVIDER_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.providers.map((p) => (
                          <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </Field>

                <Field label="Platform Name" error={errors.platformName?.message} required>
                  <input placeholder="Gmail, Outlook…" className={iCls} {...register('platformName')} />
                </Field>
              </div>

              <Field label="Website / Login URL" error={errors.platformUrl?.message}>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input placeholder="https://mail.google.com" className={`${iCls} pl-9`} {...register('platformUrl')} />
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Importance */}
                <Field label="Importance Level" error={errors.importanceLevel?.message}>
                  <select className={selectCls} {...register('importanceLevel')}>
                    {IMPORTANCE_OPTS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>

                {/* Category */}
                <Field label="Category" hint="e.g. Work, Personal, Finance">
                  <input placeholder="Work, Personal…" className={iCls} {...register('category')} />
                </Field>
              </div>

              <Field label="Tags" hint="Comma-separated, e.g. work, critical">
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input placeholder="work, primary (comma separated)" className={`${iCls} pl-9`} {...register('tags')} />
                </div>
              </Field>

              {/* Favourite checkbox */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" className="sr-only peer" {...register('isFavorite')} />
                  <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all" />
                  <svg viewBox="0 0 12 12" fill="none" className="absolute inset-0 w-full h-full p-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Star size={13} className="text-amber-400" /> Mark as Favorite</p>
                  <p className="text-xs text-slate-500">Pin this entry to the top of your vault</p>
                </div>
              </label>
            </Section>

            {/* ── Credentials ──────────────────────────────────────────── */}
            <Section title="Credentials" icon={Lock}>
              <Field label="Email / Phone / Username" error={errors.emailAddress?.message} required hint="Enter an email, phone number, or @username">
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input placeholder="email, +1 555 0100, or @username" className={`${iCls} pl-9`} {...register('emailAddress')} />
                </div>
              </Field>

              <Field label="Display Username" hint="Optional — if different from the identifier above">
                <input placeholder="john_doe" className={iCls} {...register('username')} />
              </Field>

              <Field label="Password" error={errors.password?.message} required>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      placeholder="Enter or generate a password…"
                      className={`${iCls} font-mono placeholder:font-sans`}
                      {...register('password')}
                    />
                    <button type="button" onClick={() => setShowPwd((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('password', generatePassword({ length: 20 }))}
                    className="w-11 h-[42px] flex-shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
                    title="Generate strong password"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
                {pwd && <div className="mt-2"><PasswordStrength password={pwd} /></div>}
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Last Password Changed">
                  <input type="date" className={iCls} {...register('lastPasswordChangedAt')} />
                </Field>
                <Field label="Remind me to change on">
                  <input type="date" className={iCls} {...register('nextPasswordReminderAt')} />
                </Field>
              </div>
            </Section>

            {/* ── Recovery ─────────────────────────────────────────────── */}
            <Section title="Recovery Information" icon={ShieldCheck} defaultOpen={false}>
              <Field label="Recovery Email" error={errors.recoveryEmail?.message}>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" placeholder="recovery@email.com" className={`${iCls} pl-9`} {...register('recoveryEmail')} />
                </div>
              </Field>
              <Field label="Recovery Phone" hint="Include country code, e.g. +1 555 0100">
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input placeholder="+1 555 0100" className={`${iCls} pl-9`} {...register('recoveryPhone')} />
                </div>
              </Field>
            </Section>

            {/* ── Two-Factor Auth ───────────────────────────────────────── */}
            <Section title="Two-Factor Authentication" icon={Smartphone} defaultOpen={false}>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input type="checkbox" className="sr-only peer" {...register('twoFactorEnabled')} />
                  <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all" />
                  <svg viewBox="0 0 12 12" fill="none" className="absolute inset-0 w-full h-full p-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Two-Factor Authentication Enabled</p>
                  <p className="text-xs text-slate-500">This account has 2FA turned on</p>
                </div>
              </label>

              {hasTwoFa && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                  <Field label="Authenticator App" hint="e.g. Google Authenticator, Authy, Microsoft Authenticator">
                    <div className="relative">
                      <Smartphone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input placeholder="Google Authenticator" className={`${iCls} pl-9`} {...register('authenticatorApp')} />
                    </div>
                  </Field>

                  <Field label="Backup Codes" hint="Store these safely — they're encrypted at rest">
                    <textarea
                      rows={3}
                      placeholder="One backup code per line…"
                      className={`${iCls} resize-none`}
                      {...register('backupCodes')}
                    />
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Lock size={10} /> Encrypted with AES-256-GCM before storage
                    </p>
                  </Field>

                  <Field label="App-Specific Passwords" hint="For apps that don't support 2FA">
                    <textarea
                      rows={3}
                      placeholder="App name: password (one per line)…"
                      className={`${iCls} resize-none`}
                      {...register('appPasswords')}
                    />
                  </Field>
                </motion.div>
              )}
            </Section>

            {/* ── Security Questions ────────────────────────────────────── */}
            <Section title="Security Questions" icon={HelpCircle} defaultOpen={false}>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                <p className="text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  Security questions are encrypted before storage. Never share them.
                </p>
              </div>
              <Field label="Security Questions & Answers">
                <textarea
                  rows={5}
                  placeholder={'Q: What was your first pet\'s name?\nA: Fluffy\n\nQ: What city were you born in?\nA: New York'}
                  className={`${iCls} resize-none font-mono text-xs`}
                  {...register('securityQuestions')}
                />
              </Field>
            </Section>

            {/* ── Notes ────────────────────────────────────────────────── */}
            <Section title="Private Notes" icon={Hash} defaultOpen={false}>
              <Field label="Notes" hint="Encrypted — only you can read these">
                <textarea
                  rows={5}
                  placeholder="Any additional notes about this account…"
                  className={`${iCls} resize-none`}
                  {...register('notes')}
                />
              </Field>
            </Section>

            {/* ── Actions ──────────────────────────────────────────────── */}
            <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/vault')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1">
                {isEdit ? 'Update Entry' : 'Save Entry Securely'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
