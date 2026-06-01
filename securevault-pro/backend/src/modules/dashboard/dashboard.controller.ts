import { Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { Role } from '@prisma/client';

export class DashboardController {
  async stats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await dashboardService.getStats(req.user.id, req.user.role as Role);
      sendSuccess(res, data, 'Dashboard stats retrieved');
    } catch (err) { next(err); }
  }

  async expenseTrend(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const months = parseInt(String(req.query.months ?? '6'), 10);
      const data = await dashboardService.getExpenseTrend(req.user.id, req.user.role as Role, months);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }
}

export const dashboardController = new DashboardController();
