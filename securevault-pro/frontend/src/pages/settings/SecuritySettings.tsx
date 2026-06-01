import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Shield, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { usersService } from '../../services/users.service';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { cn } from '../../utils/cn';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword:     z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const masterPasswordSchema = z.object({
  masterPassword:        z.string().min(8, 'At least 8 characters'),
  confirmMasterPassword: z.string(),
}).refine((d) => d.masterPassword === d.confirmMasterPassword, {
  message: 'Passwords do not match',
  path: ['confirmMasterPassword'],
});

type ChangePasswordForm  = z.infer<typeof changePasswordSchema>;
type MasterPasswordForm  = z.infer<typeof masterPasswordSchema>;

const SECURITY_NOTES = [
  { text: 'Passwords hashed with bcrypt (12 rounds)'           },
  { text: 'Vault entries encrypted with AES-256-GCM'           },
  { text: 'JWT tokens with 15-minute expiry + rotation'         },
  { text: 'Auto logout after 30 minutes of inactivity'          },
  { text: 'Account lock after 5 failed attempts'                },
  { text: 'All actions logged in activity audit trail'          },
];

export default function SecuritySettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [masterPasswordSet, setMasterPasswordSet] = useState(user?.hasMasterPassword ?? false);

  const pwForm = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) });
  const mpForm = useForm<MasterPasswordForm>({ resolver: zodResolver(masterPasswordSchema) });

  const handleChangePassword = async (data: ChangePasswordForm) => {
    try {
      await usersService.changePassword(data.currentPassword, data.newPassword, data.confirmPassword);
      pwForm.reset();
      toast('Password changed. Please sign in again.', 'success');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const handleSetMasterPassword = async (data: MasterPasswordForm) => {
    try {
      await authService.setMasterPassword(data.masterPassword, data.confirmMasterPassword);
      setMasterPasswordSet(true);
      updateUser({ hasMasterPassword: true });
      mpForm.reset();
      toast('Master password set successfully', 'success');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const watchNewPassword    = pwForm.watch('newPassword', '');
  const watchMasterPassword = mpForm.watch('masterPassword', '');

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Security Settings"
        description="Manage your account security and vault access"
        breadcrumb={['Settings', 'Security']}
      />

      {/* ── Change Password ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-card p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Lock size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Change Password</p>
            <p className="text-xs text-slate-500">Your account login password</p>
          </div>
        </div>

        <form onSubmit={pwForm.handleSubmit(handleChangePassword)} className="space-y-4">
          <PasswordInput
            label="Current Password"
            error={pwForm.formState.errors.currentPassword?.message}
            {...pwForm.register('currentPassword')}
          />
          <div className="space-y-1.5">
            <PasswordInput
              label="New Password"
              error={pwForm.formState.errors.newPassword?.message}
              {...pwForm.register('newPassword')}
            />
            {watchNewPassword && <PasswordStrength password={watchNewPassword} />}
          </div>
          <PasswordInput
            label="Confirm New Password"
            error={pwForm.formState.errors.confirmPassword?.message}
            {...pwForm.register('confirmPassword')}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" loading={pwForm.formState.isSubmitting} className="px-6">
              Update Password
            </Button>
          </div>
        </form>
      </motion.div>

      {/* ── Master Password ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border',
              masterPasswordSet
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-violet-50 border-violet-100',
            )}>
              <Shield size={18} className={masterPasswordSet ? 'text-emerald-600' : 'text-violet-600'} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Master Password</p>
              <p className="text-xs text-slate-500">Required to view stored vault passwords</p>
            </div>
          </div>
          {masterPasswordSet && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-semibold">
              <CheckCircle2 size={12} />
              Active
            </div>
          )}
        </div>

        {masterPasswordSet ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Master password is active</p>
                <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                  You'll need it to decrypt and view stored passwords in your vault.
                  To change it, contact your administrator or use account recovery.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={mpForm.handleSubmit(handleSetMasterPassword)} className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Important warning</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Your master password encrypts vault passwords.{' '}
                    <strong>If you forget it, stored passwords cannot be recovered.</strong>
                    {' '}Store it somewhere safe.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <PasswordInput
                label="Master Password"
                placeholder="Strong master password"
                error={mpForm.formState.errors.masterPassword?.message}
                {...mpForm.register('masterPassword')}
              />
              {watchMasterPassword && <PasswordStrength password={watchMasterPassword} />}
            </div>
            <PasswordInput
              label="Confirm Master Password"
              placeholder="Repeat master password"
              error={mpForm.formState.errors.confirmMasterPassword?.message}
              {...mpForm.register('confirmMasterPassword')}
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" loading={mpForm.formState.isSubmitting} className="px-6">
                Set Master Password
              </Button>
            </div>
          </form>
        )}
      </motion.div>

      {/* ── Security Notes ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Info size={15} className="text-blue-600" />
          </div>
          <p className="text-sm font-semibold text-slate-900">Security Architecture</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SECURITY_NOTES.map(({ text }) => (
            <div key={text} className="flex items-start gap-2.5 p-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 size={11} className="text-emerald-600" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
