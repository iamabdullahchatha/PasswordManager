import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Shield, DollarSign, BarChart3, Users,
  Activity, Key, Lock, LogOut, ChevronLeft,
  ChevronRight, ChevronDown, Wallet, FileText, Plus,
  UserCog, ShieldAlert, Target, Calendar,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/auth.service';
import { cn } from '../../utils/cn';
import type { Role } from '../../types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
  roles?: Role[];
  badge?: string;
  children?: { label: string; href: string; icon: React.ComponentType<{ className?: string; size?: number | string }> }[];
}

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Password Vault',
    href: '/vault',
    icon: Shield,
    children: [
      { label: 'All Entries',    href: '/vault',              icon: Shield      },
      { label: 'Add Entry',      href: '/vault/new',          icon: Plus        },
      { label: 'Security Report',href: '/vault/security',     icon: ShieldAlert },
      { label: 'Generator',      href: '/password-generator', icon: Key         },
    ],
  },
  {
    label: 'Expenses',
    href: '/expenses',
    icon: Wallet,
    children: [
      { label: 'Overview',     href: '/expenses',          icon: Wallet   },
      { label: 'Add Expense',  href: '/expenses/new',      icon: Plus     },
      { label: 'Monthly View', href: '/expenses/monthly',  icon: Calendar },
      { label: 'Yearly View',  href: '/expenses/yearly',   icon: BarChart3 },
      { label: 'Budgets',      href: '/expenses/budgets',  icon: Target   },
    ],
  },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Users', href: '/users', icon: Users, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { label: 'Activity Logs', href: '/activity-logs', icon: Activity },
];

const SETTINGS_NAV: NavItem[] = [
  { label: 'Profile', href: '/settings/profile', icon: UserCog },
  { label: 'Security', href: '/settings/security', icon: Lock },
];

const ROLE_HIERARCHY: Record<Role, number> = { SUPER_ADMIN: 3, ADMIN: 2, USER: 1 };

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** Hide the collapse chevron — used in the mobile drawer, which has its own X close button. */
  hideToggle?: boolean;
}

export function Sidebar({ collapsed, onToggle, hideToggle = false }: SidebarProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState<string[]>(['Password Vault', 'Expenses']);

  const canSee = (item: NavItem) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.some((r) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[r]);
  };

  const toggleExpand = (label: string) =>
    setExpanded((p) => p.includes(label) ? p.filter((x) => x !== label) : [...p, label]);

  const isExpanded = (label: string) => expanded.includes(label);

  const isActivePath = (href: string) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try { if (refreshToken) await authService.logout(refreshToken); } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <motion.nav
      className="relative flex flex-col h-full bg-sidebar overflow-hidden"
      style={{ boxShadow: '4px 0 20px rgba(0,0,0,0.2)' }}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-blue-sm">
            <Shield size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="text-sm font-bold text-white truncate leading-none">SecureVault</p>
                <p className="text-2xs text-blue-300/80 truncate">Pro</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {!hideToggle && (
          <button
            onClick={onToggle}
            className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-sidebar-muted hover:text-white hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
        {/* Main nav */}
        <div className="px-3 space-y-0.5">
          {!collapsed && (
            <p className="px-3 mb-2 text-2xs font-semibold text-sidebar-muted/60 uppercase tracking-widest">
              Main
            </p>
          )}

          {NAV.filter(canSee).map((item) =>
            item.children ? (
              <NavGroup
                key={item.label}
                item={item}
                collapsed={collapsed}
                expanded={isExpanded(item.label)}
                onToggle={() => toggleExpand(item.label)}
                location={location.pathname}
              />
            ) : (
              <NavItem
                key={item.href}
                item={item}
                collapsed={collapsed}
                active={isActivePath(item.href)}
              />
            )
          )}
        </div>

        {/* Divider */}
        <div className="mx-3 my-4 border-t border-sidebar-border" />

        {/* Settings */}
        <div className="px-3 space-y-0.5">
          {!collapsed && (
            <p className="px-3 mb-2 text-2xs font-semibold text-sidebar-muted/60 uppercase tracking-widest">
              Settings
            </p>
          )}
          {SETTINGS_NAV.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={isActivePath(item.href)}
            />
          ))}
        </div>
      </div>

      {/* User section */}
      <div className="flex-shrink-0 p-3 border-t border-sidebar-border">
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 rounded-lg text-sidebar-muted hover:text-white hover:bg-sidebar-accent transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-none">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-2xs text-sidebar-muted mt-0.5 truncate">
                {user?.role?.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 p-1.5 rounded-md text-sidebar-muted hover:text-white hover:bg-sidebar-border transition-colors"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </motion.nav>
  );
}

/* ── Nav Item ─────────────────────────────────────────────────────────────── */
function NavItem({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <NavLink
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
        active
          ? 'bg-blue-600 text-white shadow-blue-sm'
          : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
        collapsed && 'justify-center px-2',
      )}
    >
      {active && (
        <motion.span
          layoutId="active-indicator"
          className="absolute inset-0 rounded-lg bg-blue-600"
          style={{ zIndex: -1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <item.icon size={16} className="flex-shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge && !collapsed && (
        <span className="ml-auto flex-shrink-0 text-2xs bg-blue-500 text-white rounded-full px-1.5 py-0.5 leading-none">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

/* ── Nav Group ─────────────────────────────────────────────────────────────── */
function NavGroup({
  item,
  collapsed,
  expanded,
  onToggle,
  location,
}: {
  item: NavItem;
  collapsed: boolean;
  expanded: boolean;
  onToggle: () => void;
  location: string;
}) {
  const isGroupActive = location.startsWith(item.href);

  return (
    <div>
      <button
        onClick={() => !collapsed && onToggle()}
        title={collapsed ? item.label : undefined}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isGroupActive && !expanded
            ? 'bg-blue-600/20 text-blue-300'
            : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
          collapsed && 'justify-center px-2',
        )}
      >
        <item.icon size={16} className="flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 text-left truncate"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {!collapsed && (
          <ChevronDown
            size={14}
            className={cn(
              'flex-shrink-0 transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && expanded && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="ml-5 mt-0.5 pl-3 border-l border-sidebar-border space-y-0.5 pb-1">
              {item.children?.map((child) => (
                <NavLink
                  key={child.href}
                  to={child.href}
                  end={child.href === item.href}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                      isActive
                        ? 'bg-blue-600/25 text-blue-300 font-semibold'
                        : 'text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )
                  }
                >
                  <child.icon size={13} className="flex-shrink-0" />
                  {child.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
