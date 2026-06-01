import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, isSelf } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { Role } from '@prisma/client';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  listUsersQuerySchema,
} from './users.dto';

const router = Router();

router.use(authenticate as any);

router.get('/', authorize(Role.ADMIN), validate(listUsersQuerySchema, 'query'), usersController.list.bind(usersController));
router.post('/', authorize(Role.ADMIN), validate(createUserSchema), usersController.create.bind(usersController));
router.get('/:id', isSelf(), usersController.getById.bind(usersController));
router.put('/:id', isSelf(), validate(updateUserSchema), usersController.update.bind(usersController));
router.patch('/:id/toggle-status', authorize(Role.ADMIN), usersController.toggleStatus.bind(usersController));
router.delete('/:id', authorize(Role.SUPER_ADMIN), usersController.delete.bind(usersController));
router.post('/me/change-password', validate(changePasswordSchema), usersController.changePassword.bind(usersController));

export default router;
