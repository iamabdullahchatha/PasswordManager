import { Router } from 'express';
import { expensesController } from './expenses.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  budgetSchema,
  importExpensesSchema,
} from './expenses.dto';

const router = Router();

router.use(authenticate as any);

// ── Special routes first (before /:id) ──────────────────────────────────────
router.get('/summary',                expensesController.getSummary.bind(expensesController));
router.get('/compare/months',         expensesController.compareMonths.bind(expensesController));
router.get('/compare/years',          expensesController.compareYears.bind(expensesController));
router.get('/monthly/:year/:month',   expensesController.getMonthly.bind(expensesController));
router.get('/yearly/:year',           expensesController.getYearly.bind(expensesController));
router.get('/export/csv',             expensesController.exportCsv.bind(expensesController));
router.post('/import',                validate(importExpensesSchema), expensesController.importCsv.bind(expensesController));

// ── Budget routes ────────────────────────────────────────────────────────────
router.get('/budgets',                expensesController.getBudgets.bind(expensesController));
router.post('/budgets',               validate(budgetSchema), expensesController.setBudget.bind(expensesController));
router.delete('/budgets/:id',         expensesController.deleteBudget.bind(expensesController));

// ── CRUD ─────────────────────────────────────────────────────────────────────
router.get('/',    validate(listExpensesQuerySchema, 'query'), expensesController.list.bind(expensesController));
router.post('/',   validate(createExpenseSchema),              expensesController.create.bind(expensesController));
router.get('/:id',                                             expensesController.getById.bind(expensesController));
router.patch('/:id', validate(updateExpenseSchema),            expensesController.update.bind(expensesController));
router.put('/:id',   validate(updateExpenseSchema),            expensesController.update.bind(expensesController));
router.delete('/:id',                                          expensesController.delete.bind(expensesController));

export default router;
