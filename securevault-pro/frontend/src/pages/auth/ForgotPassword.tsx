import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { useState } from 'react';
import { authService } from '../../services/auth.service';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { getErrorMessage } from '../../services/api';

const schema = z.object({ email: z.string().email('Enter a valid email address') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent,  setSent]  = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setError('');
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
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
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-7 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to sign in
        </Link>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
                <CheckCircle2 size={36} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Check your inbox</h2>
              <p className="text-sm text-slate-500 mt-2.5 max-w-xs mx-auto leading-relaxed">
                If an account exists for <strong className="text-slate-700">{getValues('email')}</strong>, we sent a password reset link valid for 1 hour.
              </p>
              <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-left">
                <p className="text-xs text-blue-700 font-medium mb-1">Didn't receive the email?</p>
                <ul className="text-xs text-blue-600/70 space-y-1">
                  <li>• Check your spam or junk folder</li>
                  <li>• Make sure the email address is correct</li>
                  <li>• Wait a few minutes and try again</li>
                </ul>
              </div>
              <Link to="/login">
                <button className="mt-6 w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all shadow-blue-sm">
                  Return to Sign In
                </button>
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form">
              <div className="mb-7">
                <h1 className="text-2xl font-extrabold text-slate-900">Reset password</h1>
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Enter your email address and we'll send you a secure link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">Email address</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold transition-all shadow-blue-sm hover:shadow-blue disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2.5"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {isSubmitting ? 'Sending link…' : 'Send Reset Link'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AuthLayout>
  );
}
