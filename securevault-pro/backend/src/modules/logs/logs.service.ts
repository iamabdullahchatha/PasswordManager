import { prisma } from '../../config/database';
import { buildPaginationMeta } from '../../utils/response';
import { Prisma, LogAction, Role } from '@prisma/client';

export class LogsService {
  async getLogs(
    userId: string,
    role: Role,
    query: {
      page?: string;
      limit?: string;
      action?: string;
      success?: string;
      startDate?: string;
      endDate?: string;
      targetUserId?: string;
    },
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(100, parseInt(query.limit ?? '50', 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityLogWhereInput = {};

    // Non-admins can only see their own logs
    if (role === Role.USER) {
      where.userId = userId;
    } else if (query.targetUserId) {
      where.userId = query.targetUserId;
    }

    if (query.action && Object.values(LogAction).includes(query.action as LogAction)) {
      where.action = query.action as LogAction;
    }

    if (query.success !== undefined) {
      where.success = query.success === 'true';
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [logs, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { logs, meta: buildPaginationMeta(total, page, limit) };
  }

  async getSecurityEvents(userId: string, role: Role) {
    const where: Prisma.ActivityLogWhereInput =
      role === Role.USER
        ? { userId, action: { in: ['FAILED_LOGIN', 'PASSWORD_VIEW', 'PASSWORD_COPY', 'MASTER_PASSWORD_VERIFY'] } }
        : { action: { in: ['FAILED_LOGIN', 'PASSWORD_VIEW', 'PASSWORD_COPY', 'MASTER_PASSWORD_VERIFY'] } };

    return prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

export const logsService = new LogsService();
