import { Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../utils/AppError';
import { Role } from '@prisma/client';

export class ReportsController {
  async monthly(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year  = parseInt(req.params.year,  10);
      const month = parseInt(req.params.month, 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        throw new AppError('Invalid year or month', 400, 'INVALID_PARAMS');
      }
      const data = await reportsService.getMonthlyReport(req.user.id, year, month, req.user.role as Role);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async yearly(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      if (isNaN(year)) throw new AppError('Invalid year', 400, 'INVALID_PARAMS');
      const data = await reportsService.getYearlyReport(req.user.id, year, req.user.role as Role);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async category(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(String(req.query.year ?? new Date().getFullYear()), 10);
      const data = await reportsService.getCategoryReport(req.user.id, year, req.user.role as Role);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async paymentMethod(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(String(req.query.year ?? new Date().getFullYear()), 10);
      const data = await reportsService.getPaymentMethodReport(req.user.id, year, req.user.role as Role);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async budget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = parseInt(String(req.query.month ?? (new Date().getMonth() + 1)), 10);
      const year  = parseInt(String(req.query.year  ?? new Date().getFullYear()),    10);
      const data  = await reportsService.getBudgetReport(req.user.id, month, year);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async compareMonths(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const y1 = parseInt(String(req.query.y1), 10);
      const m1 = parseInt(String(req.query.m1), 10);
      const y2 = parseInt(String(req.query.y2), 10);
      const m2 = parseInt(String(req.query.m2), 10);
      if ([y1, m1, y2, m2].some(isNaN)) throw new AppError('y1, m1, y2, m2 required', 400, 'INVALID_PARAMS');
      const data = await reportsService.compareMonths(req.user.id, y1, m1, y2, m2, req.user.role as Role);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async compareYears(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year1 = parseInt(String(req.query.year1), 10);
      const year2 = parseInt(String(req.query.year2), 10);
      if (isNaN(year1) || isNaN(year2)) throw new AppError('year1 and year2 required', 400, 'INVALID_PARAMS');
      const data = await reportsService.compareYears(req.user.id, year1, year2, req.user.role as Role);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }
}

export const reportsController = new ReportsController();
