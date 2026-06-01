import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { AppError } from '../utils/AppError';

export interface JwtAccessPayload {
  sub: string;       // userId
  role: string;
  sessionId: string; // refreshToken id
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets are not configured in environment variables');
}

export const jwtConfig = {
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
};

export function signAccessToken(payload: Omit<JwtAccessPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = { expiresIn: jwtConfig.accessExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, ACCESS_SECRET, options);
}

export function signRefreshToken(payload: Omit<JwtRefreshPayload, 'iat' | 'exp'>): string {
  const options: SignOptions = { expiresIn: jwtConfig.refreshExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): JwtAccessPayload {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtAccessPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Access token expired', 401, 'TOKEN_EXPIRED');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid access token', 401, 'TOKEN_INVALID');
    }
    throw new AppError('Token verification failed', 401, 'TOKEN_ERROR');
  }
}

export function verifyRefreshToken(token: string): JwtRefreshPayload {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtRefreshPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
    }
    throw new AppError('Invalid refresh token', 401, 'REFRESH_TOKEN_INVALID');
  }
}

export function getTokenExpiryDate(expiresIn: string): Date {
  const now = Date.now();
  const units: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  const [, value, unit] = match;
  return new Date(now + parseInt(value, 10) * units[unit]);
}
