import { Response, NextFunction } from 'express';
import { logsService } from './logs.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { Role } from '@prisma/client';

export class LogsController {
  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { logs, meta } = await logsService.getLogs(
        req.user.id,
        req.user.role as Role,
        req.query as Record<string, string>,
      );
      sendSuccess(res, logs, 'Activity logs retrieved', 200, meta);
    } catch (err) { next(err); }
  }

  async securityEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await logsService.getSecurityEvents(req.user.id, req.user.role as Role);
      sendSuccess(res, events, 'Security events retrieved');
    } catch (err) { next(err); }
  }
}

export const logsController = new LogsController();
