import { prisma } from '../../config/database';
import { Role } from '@prisma/client';

export interface AppNotification {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  body: string;
  createdAt: string;
  link?: string;
}

export class NotificationsService {
  async getNotifications(userId: string, role: Role): Promise<AppNotification[]> {
    const notifications: AppNotification[] = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [weakCount, user, failedLogins] = await Promise.all([
      prisma.vaultEntry.count({
        where: {
          userId,
          archivedAt: null,
          passwordStrength: { lt: 40 },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { masterPasswordHash: true },
      }),
      prisma.activityLog.count({
        where: {
          userId,
          action: 'FAILED_LOGIN',
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    if (weakCount > 0) {
      notifications.push({
        id: 'weak-passwords',
        type: 'warning',
        title: 'Weak passwords detected',
        body: `${weakCount} vault ${weakCount === 1 ? 'entry needs' : 'entries need'} attention`,
        createdAt: new Date().toISOString(),
        link: '/vault/security',
      });
    }

    if (!user?.masterPasswordHash) {
      notifications.push({
        id: 'no-master-password',
        type: 'info',
        title: 'Master password not set',
        body: 'Set up a master password to protect vault access',
        createdAt: new Date().toISOString(),
        link: '/settings/security',
      });
    }

    if (failedLogins > 0) {
      notifications.push({
        id: 'failed-logins',
        type: 'error',
        title: 'Failed login attempts',
        body: `${failedLogins} failed ${failedLogins === 1 ? 'attempt' : 'attempts'} on your account in the last 7 days`,
        createdAt: new Date().toISOString(),
        link: '/activity-logs',
      });
    }

    if (role !== Role.USER) {
      const systemFailed = await prisma.activityLog.count({
        where: {
          action: 'FAILED_LOGIN',
          userId: { not: userId },
          createdAt: { gte: sevenDaysAgo },
        },
      });
      if (systemFailed > 0) {
        notifications.push({
          id: 'system-security',
          type: 'warning',
          title: 'System security alert',
          body: `${systemFailed} failed login ${systemFailed === 1 ? 'attempt' : 'attempts'} across other accounts this week`,
          createdAt: new Date().toISOString(),
          link: '/activity-logs',
        });
      }
    }

    return notifications;
  }
}

export const notificationsService = new NotificationsService();
