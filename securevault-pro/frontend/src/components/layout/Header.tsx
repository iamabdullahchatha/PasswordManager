import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, LogOut, User, Shield,
  ChevronDown, ChevronLeft, Menu, X, Activity,
  CheckCircle, AlertTriangle, Clock, XCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import { cn } from '../../utils/cn';
import { useDebounce } from '../../hooks/useDebounce';
import { useNotifications, type AppNotification } from '../../hooks/useNotifications';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

const NOTIF_ICON: Record<AppNotification['type'], React.ComponentType<any>> = {
  warning: AlertTriangle,
  error:   XCircle,
  info:    Clock,
  success: CheckCircle,
};
const NOTIF_ICON_CLASS: Record<AppNotification['type'], string> = {
  warning: 'text-amber-500',
  error:   'text-red-500',
  info:    'text-blue-500',
  success: 'text-green-500',
};
const NOTIF_BG: Record<AppNotification['type'], string> = {
  warning: 'bg-amber-100',
  error:   'bg-red-100',
  info:    'bg-blue-100',
  success: 'bg-green-100',
};

// ─── Mobile page-title map ────────────────────────────────────────────────────
// Provides a human-readable title for the mobile header on every route.
const PAGE_TITLES: Record<string, string> = {
  '/dashboard':          'Dashboard',
  '/vault':              'Password Vault',
  '/vault/new':          'Add Entry',
  '/vault/security':     'Security Report',
  '/password-generator': 'Generator',
  '/expenses':           'Expenses',
  '/expenses/new':       'Add Expense',
  '/expenses/monthly':   'Monthly View',
  '/expenses/yearly':    'Yearly View',
  '/expenses/budgets':   'Budgets',
  '/reports':            'Reports',
  '/users':              'Users',
  '/users/new':          'Add User',
  '/settings/profile':   'Profile',
  '/settings/security':  'Security',
  '/activity-logs':      'Activity Logs',
  '/notifications':      'Notifications',
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Dynamic routes
  if (/^\/vault\/[^/]+\/edit$/.test(pathname)) return 'Edit Entry';
  if (/^\/vault\/[^/]+$/.test(pathname))       return 'Entry Details';
  if (/^\/expenses\/[^/]+\/edit$/.test(pathname)) return 'Edit Expense';
  // Fallback: humanise the last path segment
  const last = pathname.split('/').filter(Boolean).pop() ?? '';
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ');
}

export function Header({ onMobileMenuToggle, sidebarCollapsed }: HeaderProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 400);
  const { notifications } = useNotifications();
  const unreadCount = notifications.length;

  // Show a back button on every page except the home dashboard
  const showBack = location.pathname !== '/dashboard';

  const handleBack = () => navigate(-1);

  // Close dropdowns on outside click
  useEffect(() => {
    const close = () => { setNotifOpen(false); setProfileOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Close dropdowns on navigation (e.g. back button or programmatic navigate)
  useEffect(() => { setNotifOpen(false); setProfileOpen(false); }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (debouncedSearch.trim()) {
      navigate(`/vault?search=${encodeURIComponent(debouncedSearch)}`);
      setSearch('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    try { if (refreshToken) await authService.logout(refreshToken); } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  // Desktop breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '));

  return (
    <header
      className="h-16 bg-white dark:bg-[hsl(222_47%_10%)] border-b border-slate-200 dark:border-[hsl(222_40%_16%)] flex items-center gap-2 px-4 lg:px-6 flex-shrink-0 z-30 sticky top-0"
      style={{ boxShadow: '0 1px 0 hsl(214 32% 91%), 0 2px 8px rgba(0,0,0,0.03)' }}
    >

      {/* ── Mobile hamburger ──────────────────────────────────────────────── */}
      <button
        onClick={onMobileMenuToggle}
        aria-label="Open navigation menu"
        className="lg:hidden flex-shrink-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400"
      >
        <Menu size={18} />
      </button>

      {/* ── Mobile: back button + page title ─────────────────────────────── */}
      {/* Fills the space between the hamburger and the action icons.
          Shown on mobile only (lg:hidden).  The back button appears on every
          page except the dashboard so the user always has a one-tap way to
          return to the previous screen. */}
      <div className="lg:hidden flex items-center flex-1 min-w-0">
        {showBack && (
          <button
            onClick={handleBack}
            aria-label="Go back"
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white mr-1"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      {/* ── Desktop breadcrumb ────────────────────────────────────────────── */}
      <div className="hidden lg:flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 min-w-0">
        {breadcrumb.length === 0 ? (
          <span className="font-semibold text-slate-900 dark:text-white">Dashboard</span>
        ) : (
          breadcrumb.map((part, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
              <span className={cn(i === breadcrumb.length - 1
                ? 'font-semibold text-slate-900 dark:text-white'
                : 'text-slate-500 dark:text-slate-400')}>
                {part}
              </span>
            </span>
          ))
        )}
      </div>

      {/* Desktop spacer */}
      <div className="hidden lg:flex flex-1" />

      {/* ── Desktop search ────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border bg-white transition-all duration-200 shadow-sm',
          searchOpen || search
            ? 'border-blue-300 ring-2 ring-blue-500/15 w-64'
            : 'border-slate-200 hover:border-slate-300 w-48',
        )}>
          <Search size={15} className={cn('flex-shrink-0 transition-colors', search ? 'text-blue-500' : 'text-slate-400')} />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setSearchOpen(false)}
            placeholder="Search vault..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none min-w-0"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="flex-shrink-0 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
      </form>

      {/* ── Action icons ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">

        {/* Notifications */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setNotifOpen((p) => !p); setProfileOpen(false); }}
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-[hsl(222_47%_10%)]" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-100 shadow-xl z-modal overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-blue-600" />
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="text-2xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                        <CheckCircle size={18} className="text-emerald-500" />
                      </div>
                      <p className="text-xs font-semibold text-slate-700">All clear</p>
                      <p className="text-xs text-slate-400 mt-0.5">No active notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon = NOTIF_ICON[n.type];
                      return (
                        <button
                          key={n.id}
                          onClick={() => { if (n.link) { navigate(n.link); setNotifOpen(false); } }}
                          className={cn(
                            'w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100/70 last:border-0',
                            n.link && 'cursor-pointer',
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', NOTIF_BG[n.type])}>
                            <Icon size={14} className={NOTIF_ICON_CLASS[n.type]} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="p-2 border-t border-slate-100">
                  <button
                    onClick={() => { navigate('/notifications'); setNotifOpen(false); }}
                    className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile dropdown */}
        <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setProfileOpen((p) => !p); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none">{user?.firstName} {user?.lastName}</p>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={13} className={cn('text-slate-400 dark:text-slate-500 transition-transform', profileOpen && 'rotate-180')} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)] z-modal overflow-hidden"
              >
                {/* User info header */}
                <div className="px-4 py-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate leading-none">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Nav items */}
                <div className="p-1.5">
                  {[
                    { label: 'Profile Settings', icon: User,     href: '/settings/profile'  },
                    { label: 'Security Settings', icon: Shield,   href: '/settings/security' },
                    { label: 'Activity Logs',     icon: Activity, href: '/activity-logs'     },
                  ].map((item) => (
                    <button
                      key={item.href}
                      onClick={() => { navigate(item.href); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      <item.icon size={15} className="text-slate-400 flex-shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Sign out */}
                <div className="p-1.5 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} className="flex-shrink-0" />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
