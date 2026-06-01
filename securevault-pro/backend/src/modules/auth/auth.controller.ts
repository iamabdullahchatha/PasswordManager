import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess, sendCreated } from '../../utils/response';
import type {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SetMasterPasswordDto,
  VerifyMasterPasswordDto,
} from './auth.dto';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.register(req.body as RegisterDto);
      sendCreated(res, user, 'Account created successfully. You can now sign in.');
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as LoginDto;
      const result = await authService.login(dto, req.ip, req.get('user-agent'));
      sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenDto;
      const result = await authService.refreshTokens(refreshToken, req.ip);
      sendSuccess(res, result, 'Token refreshed');
    } catch (err) {
      next(err);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as Partial<RefreshTokenDto>;
      await authService.logout(req.user.id, refreshToken);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as ForgotPasswordDto;
      await authService.forgotPassword(dto);
      sendSuccess(
        res,
        null,
        'If an account exists with that email, a reset link has been sent',
      );
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as ResetPasswordDto;
      await authService.resetPassword(dto);
      sendSuccess(res, null, 'Password reset successfully');
    } catch (err) {
      next(err);
    }
  }

  async setMasterPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as SetMasterPasswordDto;
      await authService.setMasterPassword(req.user.id, dto);
      sendCreated(res, null, 'Master password set successfully');
    } catch (err) {
      next(err);
    }
  }

  async verifyMasterPassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as VerifyMasterPasswordDto;
      const valid = await authService.verifyMasterPassword(req.user.id, dto);
      if (!valid) {
        res.status(401).json({ success: false, message: 'Incorrect master password', code: 'INVALID_MASTER_PASSWORD' });
        return;
      }
      sendSuccess(res, { verified: true }, 'Master password verified');
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { prisma } = await import('../../config/database');
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          isActive: true,
          lastLoginAt: true,
          masterPasswordHash: true,
          createdAt: true,
        },
      });
      sendSuccess(res, {
        ...user,
        hasMasterPassword: !!user?.masterPasswordHash,
        masterPasswordHash: undefined,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
