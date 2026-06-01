import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertTriangle, Eye, EyeOff, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { getErrorMessage } from '../../services/api';

const schema = z.object({
  email:      z.string().email('Enter a valid email address'),
  password:   z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { setAuth } = useAuthStore();

  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const from = (location.state as any)?.from?.pathname ?? '/dashboard';
  const isInactivity = (location.state as any)?.reason === 'inactivity';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setError('');
    try {
      const res = await authService.login(data.email, data.password, data.rememberMe);
      if (res.data) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <Shield size={12} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Secure Sign In</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1.5">Sign in to your SecureVault Pro account</p>
        </div>

        {/* Inactivity warning */}
        <AnimatePresence>
          {isInactivity && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 mb-5"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={14} className="text-amber-600" />
              </div>
              <p className="text-sm text-amber-700">Signed out due to inactivity</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">Email address</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center pointer-events-none">
                <Mail size={15} className="text-slate-400" />
              </div>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300"
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Lock size={15} className="text-slate-400" />
              </div>
              <input
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Your password"
                className={`w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-sm placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm hover:border-slate-300 ${showPwd ? 'font-mono tracking-widest' : 'tracking-[0.2em]'}`}
                style={{ color: '#0f172a' }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer group">

              <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register('rememberMe')}
              />
              <div className="w-[18px] h-[18px] rounded border-2 border-slate-300 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all" />
              <svg viewBox="0 0 12 12" fill="none" className="absolute inset-0 w-full h-full p-0.5 opacity-0 peer-checked:opacity-100 transition-opacity">
                <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Keep me signed in</span>
          </label>

          {/* Error */}
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
            className="w-full h-12 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold transition-all shadow-blue-sm hover:shadow-blue disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5 group"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <LogIn size={16} className="group-hover:translate-x-0.5 transition-transform" />
            )}
            <span>{isSubmitting ? 'Signing in…' : 'Sign in'}</span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Lock size={11} />
            Protected by AES-256-GCM encryption
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
