import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  User, Mail, AtSign, CheckCircle2, Shield,
  Camera, Trash2, Loader2, Clock, Monitor,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuthStore } from '../../store/authStore';
import { usersService } from '../../services/users.service';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { cn } from '../../utils/cn';

const schema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName:  z.string().min(1).max(50).trim(),
  email:     z.string().email(),
  username:  z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
});
type FormData = z.infer<typeof schema>;

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-violet-500 to-violet-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
];
function avatarColor(email: string) {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
}

/* ── Canvas-based square-crop + compress to JPEG ─────────────────────────── */
function compressAvatar(dataUrl: string, size = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      const shorter = Math.min(img.width, img.height);
      const sx = (img.width  - shorter) / 2;
      const sy = (img.height - shorter) / 2;
      ctx.drawImage(img, sx, sy, shorter, shorter, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const gradient = avatarColor(user?.email ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName  ?? '',
      email:     user?.email     ?? '',
      username:  user?.username  ?? '',
    },
  });

  /* ── Profile info submit ─────────────────────────────────────────────────── */
  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      const res = await usersService.update(user.id, data);
      if (res.data) { updateUser(res.data); toast('Profile updated', 'success'); }
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  /* ── Avatar upload ───────────────────────────────────────────────────────── */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset input so same file can be re-selected
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      toast('Please select an image file (JPG, PNG, WebP)', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Image must be under 5 MB', 'error');
      return;
    }

    setAvatarLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const raw = ev.target?.result as string;
          const compressed = await compressAvatar(raw, 200);
          setPreviewAvatar(compressed);

          const res = await usersService.update(user!.id, { avatar: compressed });
          if (res.data) {
            updateUser(res.data);
            toast('Profile picture updated', 'success');
          }
        } catch (err) {
          toast(getErrorMessage(err), 'error');
        } finally {
          setAvatarLoading(false);
        }
      };
      reader.onerror = () => {
        toast('Failed to read file', 'error');
        setAvatarLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
      setAvatarLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarLoading(true);
    try {
      const res = await usersService.update(user.id, { avatar: null });
      if (res.data) {
        updateUser(res.data);
        setPreviewAvatar(null);
        toast('Profile picture removed', 'success');
      }
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setAvatarLoading(false);
    }
  };

  const currentAvatar = previewAvatar ?? user?.avatar;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Manage your personal information"
        breadcrumb={['Settings', 'Profile']}
        icon={User}
      />

      {/* ── Profile card ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden"
      >
        {/* Cover */}
        <div className="h-28 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#2563eb 40%,#4f46e5 100%)' }}
        >
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize: '18px 18px' }}
          />
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 65%)' }} />
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-9 mb-4">
            {/* Avatar with upload overlay */}
            <div className="relative group">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Avatar display */}
              <div
                className="w-[72px] h-[72px] rounded-2xl border-4 border-white shadow-lg overflow-hidden cursor-pointer select-none flex-shrink-0"
                onClick={() => !avatarLoading && fileInputRef.current?.click()}
              >
                {currentAvatar ? (
                  <img
                    src={currentAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center text-2xl font-extrabold text-white uppercase', gradient)}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}

                {/* Hover overlay */}
                <div className={cn(
                  'absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center transition-opacity',
                  avatarLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}>
                  {avatarLoading
                    ? <Loader2 size={22} className="text-white animate-spin" />
                    : <Camera size={22} className="text-white" />
                  }
                </div>
              </div>

              {/* Remove button — shown if avatar is set */}
              {currentAvatar && !avatarLoading && (
                <button
                  onClick={handleRemoveAvatar}
                  title="Remove photo"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-sm transition-colors border-2 border-white"
                >
                  <Trash2 size={9} />
                </button>
              )}
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 pb-1">
              {user?.isEmailVerified && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 size={12} />
                  Verified
                </div>
              )}
              <Badge variant={
                user?.role === 'SUPER_ADMIN' ? 'destructive' :
                user?.role === 'ADMIN' ? 'warning' : 'default'
              }>
                {user?.role?.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-none">{user?.firstName} {user?.lastName}</h3>
          <p className="text-sm text-slate-500 mt-0.5">@{user?.username}</p>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>

          {/* Upload hint */}
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
            <Camera size={11} />
            Click the avatar to upload a new photo · JPG, PNG, WebP up to 5 MB
          </p>
        </div>
      </motion.div>

      {/* ── Edit form ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.07 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)] p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <User size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Personal Information</p>
            <p className="text-xs text-slate-500">Update your profile details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last Name"  error={errors.lastName?.message}  {...register('lastName')} />
          </div>

          <Input
            label="Username"
            leftIcon={AtSign}
            error={errors.username?.message}
            hint="Letters, numbers, underscores only"
            {...register('username')}
          />

          <Input
            label="Email Address"
            type="email"
            leftIcon={Mail}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={!isDirty} className="px-6">
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>

      {/* ── Account Details ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)] p-6"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Account Details</p>
            <p className="text-xs text-slate-500">Security and verification status</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Master Password', value: user?.hasMasterPassword ? 'Configured' : 'Not set', ok: user?.hasMasterPassword },
            { label: 'Email Verified',  value: user?.isEmailVerified   ? 'Verified'    : 'Unverified', ok: user?.isEmailVerified },
          ].map(({ label, value, ok }) => (
            <div key={label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', ok ? 'bg-emerald-500' : 'bg-slate-300')} />
                <p className={cn('text-sm font-semibold', ok ? 'text-emerald-700' : 'text-slate-500')}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Last Login */}
        {user?.lastLoginAt && (
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Last Session</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock size={13} className="text-slate-400" />
                <span>{new Date(user.lastLoginAt).toLocaleString()}</span>
              </div>
              {user?.lastLoginIp && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Monitor size={13} className="text-slate-400" />
                  <span>IP: {user.lastLoginIp}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
