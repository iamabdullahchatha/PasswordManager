import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { authService } from '../../services/auth.service';
import { Button } from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { getErrorMessage } from '../../services/api';

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const watchPassword = watch('password', '');

  const onSubmit = async (data: Form) => {
    if (!token) { setError('Reset token is missing'); return; }
    try {
      await authService.resetPassword(token, data.password, data.confirmPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Password Reset!</h2>
          <p className="text-sm text-slate-500 mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg mb-4">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Set New Password</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <PasswordInput label="New Password" placeholder="Strong password" error={errors.password?.message} {...register('password')} />
              {watchPassword && <PasswordStrength password={watchPassword} />}
            </div>
            <PasswordInput label="Confirm Password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" loading={isSubmitting} className="w-full h-11">
              Reset Password
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
