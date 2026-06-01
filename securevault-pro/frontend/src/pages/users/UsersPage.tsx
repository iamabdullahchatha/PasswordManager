import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Search, UserCheck, UserX, Trash2,
  Shield, Users, Clock,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmDialog } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { usersService } from '../../services/users.service';
import { useAuthStore } from '../../store/authStore';
import { useDebounce } from '../../hooks/useDebounce';
import { toast } from '../../hooks/useToast';
import { getErrorMessage } from '../../services/api';
import { formatRelativeTime } from '../../utils/format';
import { cn } from '../../utils/cn';
import type { User } from '../../types';

const ROLE_CFG: Record<string, { variant: 'destructive' | 'warning' | 'default'; label: string }> = {
  SUPER_ADMIN: { variant: 'destructive', label: 'Super Admin' },
  ADMIN:       { variant: 'warning',     label: 'Admin'       },
  USER:        { variant: 'default',     label: 'User'        },
};

const AVATAR_COLORS = [
  'from-blue-500 to-blue-600',
  'from-violet-500 to-violet-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-indigo-500 to-indigo-600',
];

function avatarColor(email: string) {
  return AVATAR_COLORS[email.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch     = useDebounce(search, 400);
  const [deleteModal, setDeleteModal] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await usersService.list(params);
      setUsers(res.data ?? []);
    } finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleStatus = async (user: User) => {
    try {
      const updated = await usersService.toggleStatus(user.id);
      setUsers((p) => p.map((u) => u.id === user.id ? (updated.data ?? u) : u));
      toast(`User ${updated.data?.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      await usersService.delete(deleteModal.id);
      setUsers((p) => p.filter((u) => u.id !== deleteModal.id));
      setDeleteModal(null);
      toast('User deleted', 'success');
    } catch (err) { toast(getErrorMessage(err), 'error'); }
  };

  const activeCount   = users.filter((u) => u.isActive).length;
  const adminCount    = users.filter((u) => u.role !== 'USER').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage team members and their access levels"
        icon={Users}
        action={
          <Link to="/users/new">
            <Button variant="primary" leftIcon={Plus}>Add User</Button>
          </Link>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Users',  value: users.length,   color: 'bg-blue-50   border-blue-100', text: 'text-blue-700'    },
          { label: 'Active',       value: activeCount,    color: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700' },
          { label: 'Admins',       value: adminCount,     color: 'bg-violet-50  border-violet-100',  text: 'text-violet-700'  },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl border p-4 text-center', s.color)}>
            <p className={cn('text-2xl font-extrabold', s.text)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      {loading ? <PageLoader /> : users.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No users found"
          description={search ? 'No users match your search' : 'Add your first team member'}
          action={
            !search
              ? <Link to="/users/new"><Button variant="primary" leftIcon={Plus}>Add User</Button></Link>
              : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['User', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user, i) => {
                  const roleConf = ROLE_CFG[user.role] ?? ROLE_CFG.USER;
                  const isMe     = user.id === currentUser?.id;
                  const gradient = avatarColor(user.email);
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white uppercase flex-shrink-0',
                            gradient,
                          )}>
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              {isMe && (
                                <Badge variant="blue" size="xs">You</Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">
                        <Badge variant={roleConf.variant}>{roleConf.label}</Badge>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <Badge variant={user.isActive ? 'success' : 'secondary'} dot>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      {/* Last login */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Clock size={12} className="text-slate-400" />
                          {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        {!isMe ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleToggleStatus(user)}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                              className={user.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}
                            >
                              {user.isActive
                                ? <UserX size={14} />
                                : <UserCheck size={14} />}
                            </Button>
                            {currentUser?.role === 'SUPER_ADMIN' && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteModal(user)}
                                className="text-red-500 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete User"
        description={`Permanently delete ${deleteModal?.firstName} ${deleteModal?.lastName}? All their data will be removed.`}
        confirmLabel="Delete User"
        variant="destructive"
        icon={Trash2}
      />
    </div>
  );
}
