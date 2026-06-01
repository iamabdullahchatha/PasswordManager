import { prisma } from '../../config/database';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  getTokenExpiryDate,
  jwtConfig,
} from '../../config/jwt';
import { generateSecureToken } from '../../config/encryption';
import { hashPassword, comparePassword } from '../../utils/password';
import { AppError } from '../../utils/AppError';
import { createActivityLog } from '../../middleware/activityLogger.middleware';
import type {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SetMasterPasswordDto,
  VerifyMasterPasswordDto,
} from './auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { emailService } from '../../services/email.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;

// Pre-computed valid bcrypt hash used for constant-time comparison when
// a user is not found, preventing user-enumeration via timing attacks.
// Generated once at module load — this is intentionally async at module level.
const TIMING_SAFE_HASH = hashPassword(generateSecureToken(32));

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar: string | null;
    hasMasterPassword: boolean;
    lastLoginAt: Date | null;
    lastLoginIp: string | null;
  };
}

export class AuthService {
  async register(dto: RegisterDto): Promise<{ id: string; email: string; username: string }> {
    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } }),
      prisma.user.findUnique({ where: { username: dto.username }, select: { id: true } }),
    ]);

    if (existingEmail) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_TAKEN');
    }
    if (existingUsername) {
      throw new AppError('This username is already taken', 409, 'USERNAME_TAKEN');
    }

    const hashed = await hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName:  dto.lastName,
        username:  dto.username,
        email:     dto.email,
        password:  hashed,
        role:      'USER',
      },
      select: { id: true, email: true, username: true, firstName: true },
    });

    await createActivityLog({ userId: user.id, action: 'USER_CREATE' });
    await emailService.sendWelcome(user.email, user.firstName);

    return { id: user.id, email: user.email, username: user.username };
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        password: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        masterPasswordHash: true,
        lastLoginAt: true,
      },
    });

    const logFailed = async (userId?: string) => {
      if (userId) {
        await createActivityLog({
          userId,
          action: 'FAILED_LOGIN',
          ipAddress,
          userAgent,
          success: false,
          errorMessage: 'Invalid credentials',
        });
      }
    };

    if (!user) {
      // Constant-time comparison — prevents user-enumeration via timing attacks
      await comparePassword('__timing_safe_dummy__', await TIMING_SAFE_HASH);
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await logFailed(user.id);
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new AppError(
        `Account locked. Try again in ${minutesLeft} minute(s)`,
        423,
        'ACCOUNT_LOCKED',
      );
    }

    if (!user.isActive) {
      await logFailed(user.id);
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    const isValidPassword = await comparePassword(dto.password, user.password);

    if (!isValidPassword) {
      const newAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000)
            : null,
        },
      });

      await logFailed(user.id);

      if (shouldLock) {
        throw new AppError(
          `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes`,
          423,
          'ACCOUNT_LOCKED',
        );
      }

      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Reset failed attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    const tokens = await this._issueTokens(user.id, user.role);

    await createActivityLog({
      userId: user.id,
      action: 'LOGIN',
      ipAddress,
      userAgent,
      success: true,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        hasMasterPassword: !!user.masterPasswordHash,
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: ipAddress ?? null,
      },
    };
  }

  async refreshTokens(refreshTokenValue: string, ipAddress?: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshTokenValue);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true,
            isActive: true,
            masterPasswordHash: true,
            lastLoginAt: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401, 'REFRESH_TOKEN_INVALID');
    }

    if (!storedToken.user.isActive) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    // Rotate refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    const tokens = await this._issueTokens(storedToken.user.id, storedToken.user.role);

    await createActivityLog({
      userId: storedToken.user.id,
      action: 'TOKEN_REFRESH',
      ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        username: storedToken.user.username,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
        avatar: storedToken.user.avatar,
        hasMasterPassword: !!storedToken.user.masterPasswordHash,
        lastLoginAt: storedToken.user.lastLoginAt ?? null,
        lastLoginIp: null,
      },
    };
  }

  async logout(userId: string, refreshTokenValue?: string): Promise<void> {
    if (refreshTokenValue) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshTokenValue, userId },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    } else {
      // Revoke all sessions
      await prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });
    }

    await createActivityLog({ userId, action: 'LOGOUT' });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, firstName: true },
    });

    // Always respond the same to prevent user enumeration
    if (!user) return;

    const token = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt },
    });

    // Send password reset email (falls back to console log in dev mode)
    await emailService.sendPasswordReset(dto.email, user.firstName, token);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const reset = await prisma.passwordReset.findUnique({
      where: { token: dto.token },
      include: { user: { select: { id: true } } },
    });

    if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
      throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    const hashed = await hashPassword(dto.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: {
          password: hashed,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens for this user
      prisma.refreshToken.updateMany({
        where: { userId: reset.userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    await createActivityLog({
      userId: reset.userId,
      action: 'PASSWORD_RESET_COMPLETE',
    });
  }

  async setMasterPassword(userId: string, dto: SetMasterPasswordDto): Promise<void> {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { masterPasswordHash: true },
    });

    if (existing?.masterPasswordHash) {
      throw new AppError('Master password is already set — use the security settings to change it', 409, 'MASTER_PASSWORD_EXISTS');
    }

    const hashed = await hashPassword(dto.masterPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { masterPasswordHash: hashed, masterPasswordSetAt: new Date() },
    });

    await createActivityLog({ userId, action: 'MASTER_PASSWORD_SET' });
  }

  async verifyMasterPassword(userId: string, dto: VerifyMasterPasswordDto): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { masterPasswordHash: true },
    });

    if (!user?.masterPasswordHash) {
      throw new AppError('Master password not set', 400, 'MASTER_PASSWORD_NOT_SET');
    }

    const isValid = await comparePassword(dto.masterPassword, user.masterPasswordHash);

    await createActivityLog({
      userId,
      action: 'MASTER_PASSWORD_VERIFY',
      success: isValid,
    });

    return isValid;
  }

  private async _issueTokens(
    userId: string,
    role: string,
  ): Promise<Omit<AuthTokens, 'user'>> {
    const sessionId = uuidv4();

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken({ sub: userId, role, sessionId }),
      signRefreshToken({ sub: userId, sessionId }),
    ]);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: getTokenExpiryDate(jwtConfig.refreshExpiresIn),
      },
    });

    // Clean up expired tokens
    await prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    return { accessToken, refreshToken, expiresIn: 15 * 60 };
  }
}

export const authService = new AuthService();
