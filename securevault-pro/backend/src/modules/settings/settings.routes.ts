import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../utils/response';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate as any);

router.get('/', authorize(Role.ADMIN), async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.systemSetting.findMany({ where: {} });
    sendSuccess(res, settings);
  } catch (err) { next(err); }
});

router.put('/:key', authorize(Role.SUPER_ADMIN), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.systemSetting.upsert({
      where: { key: req.params.key },
      update: { value: String(req.body.value), updatedById: req.user.id },
      create: { key: req.params.key, value: String(req.body.value), updatedById: req.user.id },
    });
    sendSuccess(res, setting, 'Setting updated');
  } catch (err) { next(err); }
});

export default router;
