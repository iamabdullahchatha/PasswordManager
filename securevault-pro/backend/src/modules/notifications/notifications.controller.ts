import { Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { Role } from '@prisma/client';

export class NotificationsController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await notificationsService.getNotifications(
        req.user.id,
        req.user.role as Role,
      );
      sendSuccess(res, notifications, 'Notifications retrieved');
    } catch (err) { next(err); }
  }
}

export const notificationsController = new NotificationsController();
