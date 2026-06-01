import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { authRateLimiter, sensitiveRateLimiter } from '../../config/rateLimit';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setMasterPasswordSchema,
  verifyMasterPasswordSchema,
} from './auth.dto';

const router = Router();

// Public routes
router.post('/register',        authRateLimiter, validate(registerSchema),        authController.register.bind(authController));
router.post('/login',           authRateLimiter, validate(loginSchema),           authController.login.bind(authController));
router.post('/refresh', validate(refreshTokenSchema), authController.refresh.bind(authController));
router.post('/forgot-password', sensitiveRateLimiter, validate(forgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', sensitiveRateLimiter, validate(resetPasswordSchema), authController.resetPassword.bind(authController));

// Protected routes
router.use(authenticate as any);
router.post('/logout', authController.logout.bind(authController));
router.get('/me', authController.me.bind(authController));
router.post('/master-password/set', sensitiveRateLimiter, validate(setMasterPasswordSchema), authController.setMasterPassword.bind(authController));
router.post('/master-password/verify', sensitiveRateLimiter, validate(verifyMasterPasswordSchema), authController.verifyMasterPassword.bind(authController));

export default router;
