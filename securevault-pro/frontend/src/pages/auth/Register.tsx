import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, UserPlus, AtSign } from 'lucide-react';
import { useState } from 'react';
import { authService } from '../../services/auth.service';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { getErrorMessage } from '../../services/api';

const schema = z.object({
  firstName:       z.string().min(1, 'Required').max(50).trim(),
  lastName:        z.string().min(1, 'Required').max(50).trim(),
  username:        z.string().min(3, 'Min 3 characters').max(30)
                    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, underscores only'),
  email:           z.string().email('Enter a valid email'),
  password:        z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'One uppercase letter required')
    .regex(/[a-z]/, 'One lowercase letter required')
    .regex(/[0-9]/, 'One number required')
    .regex(/[^A-Za-z0-9]/, 'One special character required'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

// Base class for all inputs — explicit dark text color prevents browser/OS-dependent inheritance
const inputCls =
  'w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300';

// Password-specific class — uses font-mono only when text is visible (type="text")
// When type="password", browsers render bullet chars in their own font; font-mono can make them invisible on some systems
const pwdInputCls = (visible: boolean) =>
  `${inputCls} pr-11 ${visible ? 'font-mono tracking-widest' : 'tracking-[0.2em]'} placeholder:font-sans placeholder:tracking-normal`;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const pwd = watch('password', '');

  const onSubmit = async (data: Form) => {
    setError('');
    try {
      await authService.register({
        firstName:       data.firstName,
        lastName:        data.lastName,
        username:        data.username,
        email:           data.email,
        password:        data.password,
        confirmPassword: data.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (success) return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <CheckCircle2 size={36} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Account Created!</h2>
        <p className="text-sm text-slate-500 mt-2">Redirecting you to sign in…</p>
        <div className="mt-5 flex justify-center">
          <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: 'linear' }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </AuthLayout>
  );

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold text-slate-900">Create account</h1>
          <p className="text-sm text-slate-500 mt-1.5">Set up your SecureVault Pro workspace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First Name" error={errors.firstName?.message}>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="John"
                  className={inputCls}
                  style={{ color: '#0f172a' }}
                  {...register('firstName')}
                />
              </div>
            </Field>
            <Field label="Last Name" error={errors.lastName?.message}>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Doe"
                  className={inputCls}
                  style={{ color: '#0f172a' }}
                  {...register('lastName')}
                />
              </div>
            </Field>
          </div>

          {/* Username */}
          <Field label="Username" error={errors.username?.message}>
            <div className="relative">
              <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="johndoe"
                className={inputCls}
                style={{ color: '#0f172a' }}
                {...register('username')}
              />
            </div>
          </Field>

          {/* Email */}
          <Field label="Email Address" error={errors.email?.message}>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="email"
                placeholder="john@example.com"
                className={inputCls}
                style={{ color: '#0f172a' }}
                {...register('email')}
              />
            </div>
          </Field>

          {/* Password */}
          <Field label="Password" error={errors.password?.message}>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Strong password"
                className={pwdInputCls(showPwd)}
                style={{ color: '#0f172a' }}
                autoComplete="new-password"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {pwd && <div className="mt-2"><PasswordStrength password={pwd} /></div>}
          </Field>

          {/* Confirm password */}
          <Field label="Confirm Password" error={errors.confirmPassword?.message}>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat password"
                className={pwdInputCls(showConfirm)}
                style={{ color: '#0f172a' }}
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200"
              >
                <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} className="text-red-600" />
                </div>
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold transition-all shadow-blue-sm hover:shadow-blue disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5"
          >
            {isSubmitting
              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : <UserPlus size={16} />}
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
