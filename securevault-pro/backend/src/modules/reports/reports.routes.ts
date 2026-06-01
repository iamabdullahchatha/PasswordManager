import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/monthly/:year/:month', reportsController.monthly.bind(reportsController));
router.get('/yearly/:year',         reportsController.yearly.bind(reportsController));
router.get('/category',             reportsController.category.bind(reportsController));
router.get('/payment-method',       reportsController.paymentMethod.bind(reportsController));
router.get('/budget',               reportsController.budget.bind(reportsController));
router.get('/compare/months',       reportsController.compareMonths.bind(reportsController));
router.get('/compare/years',        reportsController.compareYears.bind(reportsController));

export default router;
