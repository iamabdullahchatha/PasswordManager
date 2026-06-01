import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/stats', dashboardController.stats.bind(dashboardController));
router.get('/expense-trend', dashboardController.expenseTrend.bind(dashboardController));

export default router;
