import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { prisma } from '../config/database';
import { LogAction } from '@prisma/client';
import { logger } from '../utils/logger';

export function logActivity(
  action: LogAction,
  resource?: string,
  getResourceId?: (req: AuthRequest) => string | undefined,
) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    next();

    // Log asynchronously after response (fire and forget)
    setImmediate(async () => {
      try {
        await prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action,
            resource,
            resourceId: getResourceId?.(req),
            ipAddress: req.ip ?? req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            success: true,
          },
        });
      } catch (err) {
        logger.error('Failed to write activity log:', err);
      }
    });
  };
}

export async function createActivityLog(params: {
  userId: string;
  action: LogAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: params.metadata as any,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        success: params.success ?? true,
        errorMessage: params.errorMessage,
      },
    });
  } catch (err) {
    logger.error('Failed to create activity log:', err);
  }
}
