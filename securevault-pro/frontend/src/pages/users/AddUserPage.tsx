import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, Shield } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { PasswordStrength } from '../../components/ui/PasswordStrength';
import { Badge } from '../../components/ui/Badge';
import { usersService } from '../../services/users.service';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { cn } from '../../utils/cn';
import type { Role } from '../../types';

const schema = z.object({
  firstName:       z.string().min(1).max(50).trim(),
  lastName:        z.string().min(1).max(50).trim(),
  username:        z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email:           z.string().email(),
  password:        z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
  role:            z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const ROLES = [
  { value: 'USER',       label: 'User',       desc: 'Standard access — vault and expenses',         badge: 'default'      as const },
  { value: 'ADMIN',      label: 'Admin',      desc: 'Manage users + full access',                   badge: 'warning'      as const },
  { value: 'SUPER_ADMIN',label: 'Super Admin',desc: 'Full system access including Super Admin ops',  badge: 'destructive'  as const },
];

const selectCls =
  'w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm';

export default function AddUserPage() {
  const navigate         = useNavigate();
  const { user: me }     = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'USER' },
  });

  const watchPassword = watch('password', '');
  const selectedRole  = watch('role');

  const onSubmit = async (data: FormData) => {
    try {
      await usersService.create({
        firstName: data.firstName,
        lastName:  data.lastName,
        username:  data.username,
        email:     data.email,
        password:  data.password,
        role:      data.role as Role,
      });
      toast('User created successfully', 'success');
      navigate('/users');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Add New User"
        description="Create a team member account"
        icon={UserPlus}
        breadcrumb={['Users', 'New User']}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* ── Personal Info ──────────────────────────────────── */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users size={16} className="text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Personal Information</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" placeholder="John" error={errors.firstName?.message} required {...register('firstName')} />
                <Input label="Last Name"  placeholder="Doe"  error={errors.lastName?.message}  required {...register('lastName')} />
              </div>
              <Input label="Username"       placeholder="johndoe"          error={errors.username?.message} hint="Letters, numbers, underscores" required {...register('username')} />
              <Input label="Email Address"  type="email" placeholder="john@company.com" error={errors.email?.message}    required {...register('email')} />
            </div>
          </div>

          {/* ── Role ──────────────────────────────────────────── */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <Shield size={16} className="text-violet-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Access Level</p>
            </div>

            <div className="space-y-2">
              {ROLES.filter((r) => r.value !== 'SUPER_ADMIN' || me?.role === 'SUPER_ADMIN').map((role) => (
                <label key={role.value} className={cn(
                  'flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all',
                  selectedRole === role.value
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 hover:bg-slate-50',
                )}>
                  <input type="radio" value={role.value} className="sr-only" {...register('role')} />
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedRole === role.value ? 'border-blue-600' : 'border-slate-300',
                  )}>
                    {selectedRole === role.value && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{role.label}</p>
                      <Badge variant={role.badge} size="xs">{role.label}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* ── Password ──────────────────────────────────────── */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                <Shield size={16} className="text-orange-600" />
              </div>
              <p className="text-sm font-semibold text-slate-900">Account Password</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <PasswordInput label="Password" placeholder="Strong password" error={errors.password?.message} required {...register('password')} />
                {watchPassword && <PasswordStrength password={watchPassword} />}
              </div>
              <PasswordInput label="Confirm Password" placeholder="Repeat password" error={errors.confirmPassword?.message} required {...register('confirmPassword')} />
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────────── */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate('/users')} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" loading={isSubmitting} className="flex-1" leftIcon={UserPlus}>
              Create User
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
