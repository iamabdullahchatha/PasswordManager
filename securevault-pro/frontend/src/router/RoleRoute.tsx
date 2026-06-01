import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';

interface Props {
  children: ReactNode;
  roles: Role[];
}

const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  USER: 1,
};

export function RoleRoute({ children, roles }: Props) {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = roles.some(
    (role) => ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role],
  );

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
