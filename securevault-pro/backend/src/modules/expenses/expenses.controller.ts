import { Response, NextFunction } from 'express';
import { expensesService } from './expenses.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../../utils/response';
import type { CreateExpenseDto, UpdateExpenseDto, ListExpensesQuery, BudgetDto, ImportExpensesDto } from './expenses.dto';
import { AppError } from '../../utils/AppError';

export class ExpensesController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expensesService.create(req.user.id, req.body as CreateExpenseDto);
      sendCreated(res, expense, 'Expense recorded');
    } catch (err) { next(err); }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { expenses, meta } = await expensesService.list(req.user.id, req.query as unknown as ListExpensesQuery);
      sendSuccess(res, expenses, 'Expenses retrieved', 200, meta);
    } catch (err) { next(err); }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expensesService.getById(req.params.id, req.user.id);
      sendSuccess(res, expense);
    } catch (err) { next(err); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const expense = await expensesService.update(req.params.id, req.user.id, req.body as UpdateExpenseDto);
      sendSuccess(res, expense, 'Expense updated');
    } catch (err) { next(err); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await expensesService.delete(req.params.id, req.user.id);
      sendSuccess(res, null, 'Expense deleted');
    } catch (err) { next(err); }
  }

  async getMonthly(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year  = parseInt(req.params.year,  10);
      const month = parseInt(req.params.month, 10);
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        throw new AppError('Invalid year or month', 400, 'INVALID_DATE_PARAMS');
      }
      const data = await expensesService.getMonthly(req.user.id, year, month);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getYearly(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.params.year, 10);
      if (isNaN(year)) throw new AppError('Invalid year', 400, 'INVALID_DATE_PARAMS');
      const data = await expensesService.getYearly(req.user.id, year);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async getSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await expensesService.getSummary(req.user.id);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async compareMonths(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const y1 = parseInt(req.query.y1 as string, 10);
      const m1 = parseInt(req.query.m1 as string, 10);
      const y2 = parseInt(req.query.y2 as string, 10);
      const m2 = parseInt(req.query.m2 as string, 10);
      if ([y1, m1, y2, m2].some(isNaN)) throw new AppError('Invalid date params', 400, 'INVALID_DATE_PARAMS');
      const data = await expensesService.compareMonths(req.user.id, y1, m1, y2, m2);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async compareYears(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const year1 = parseInt(req.query.year1 as string, 10);
      const year2 = parseInt(req.query.year2 as string, 10);
      if (isNaN(year1) || isNaN(year2)) throw new AppError('Invalid year params', 400, 'INVALID_DATE_PARAMS');
      const data = await expensesService.compareYears(req.user.id, year1, year2);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  // ─── Budget ─────────────────────────────────────────────────────────────

  async getBudgets(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = parseInt(req.query.month as string, 10) || (new Date().getMonth() + 1);
      const year  = parseInt(req.query.year  as string, 10) || new Date().getFullYear();
      const data  = await expensesService.getBudgets(req.user.id, month, year);
      sendSuccess(res, data);
    } catch (err) { next(err); }
  }

  async setBudget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const budget = await expensesService.setBudget(req.user.id, req.body as BudgetDto);
      sendCreated(res, budget, 'Budget saved');
    } catch (err) { next(err); }
  }

  async deleteBudget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await expensesService.deleteBudget(req.params.id, req.user.id);
      sendSuccess(res, null, 'Budget deleted');
    } catch (err) { next(err); }
  }

  // ─── Export / Import ──────────────────────────────────────────────────────

  async exportCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv = await expensesService.exportCsv(req.user.id, req.query as any);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="expenses-${Date.now()}.csv"`);
      res.send(csv);
    } catch (err) { next(err); }
  }

  async importCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await expensesService.importCsv(req.user.id, req.body as ImportExpensesDto);
      sendCreated(res, result, `Imported ${result.imported} expenses`);
    } catch (err) { next(err); }
  }
}

export const expensesController = new ExpensesController();
