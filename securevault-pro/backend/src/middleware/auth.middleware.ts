import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtAccessPayload } from '../config/jwt';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user: {
    id: string;
    role: string;
    sessionId: string;
  };
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authorization token required', 401, 'NO_TOKEN');
    }

    const token = authHeader.slice(7);
    const payload: JwtAccessPayload = verifyAccessToken(token);

    // Verify the user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true, passwordChangedAt: true },
    });

    if (!user) {
      throw new AppError('User not found', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    // Reject tokens issued before the last password change
    if (user.passwordChangedAt && payload.iat) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (payload.iat < changedAt) {
        throw new AppError('Password recently changed — please log in again', 401, 'PASSWORD_CHANGED');
      }
    }

    (req as AuthRequest).user = {
      id: user.id,
      role: user.role,
      sessionId: payload.sessionId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
