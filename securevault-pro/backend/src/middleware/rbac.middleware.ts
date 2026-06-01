import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from '../utils/AppError';
import { Role } from '@prisma/client';

const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 3,
  ADMIN: 2,
  USER: 1,
};

export function authorize(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as Role;

    if (!userRole) {
      return next(new AppError('Authentication required', 401, 'NOT_AUTHENTICATED'));
    }

    const hasPermission = roles.some(
      (role) => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role],
    );

    if (!hasPermission) {
      return next(
        new AppError(
          `Access denied — requires role: ${roles.join(' or ')}`,
          403,
          'INSUFFICIENT_PERMISSIONS',
        ),
      );
    }

    next();
  };
}

export function isSuperAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  if (req.user?.role !== Role.SUPER_ADMIN) {
    return next(new AppError('Super Admin access required', 403, 'SUPER_ADMIN_REQUIRED'));
  }
  next();
}

export function isAdmin(req: AuthRequest, _res: Response, next: NextFunction): void {
  const role = req.user?.role as Role;
  if (ROLE_HIERARCHY[role] < ROLE_HIERARCHY[Role.ADMIN]) {
    return next(new AppError('Admin access required', 403, 'ADMIN_REQUIRED'));
  }
  next();
}

export function isSelf(paramName = 'id') {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    const targetId = req.params[paramName];
    const userId = req.user?.id;
    const role = req.user?.role as Role;

    if (targetId !== userId && ROLE_HIERARCHY[role] < ROLE_HIERARCHY[Role.ADMIN]) {
      return next(new AppError('You can only access your own resources', 403, 'FORBIDDEN'));
    }
    next();
  };
}
