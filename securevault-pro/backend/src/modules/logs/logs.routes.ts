import { Router } from 'express';
import { logsController } from './logs.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate as any);

router.get('/', logsController.list.bind(logsController));
router.get('/security', logsController.securityEvents.bind(logsController));

export default router;
