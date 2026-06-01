import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Sanitize field name — map internal DB column names to user-friendly ones
      const rawTarget = (err.meta?.target as string[]) ?? [];
      const safeField = rawTarget
        .map((f) => f.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
        .find((f) => !['UserId', 'Id'].includes(f)) ?? 'field';
      res.status(409).json({
        success: false,
        message: `A record with this ${safeField} already exists`,
        code: 'DUPLICATE_ENTRY',
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Record not found',
        code: 'NOT_FOUND',
      });
      return;
    }
    // Log full error internally but never expose Prisma internals to client
    logger.error('Prisma error:', { code: err.code });
    res.status(500).json({ success: false, message: 'Database error', code: 'DB_ERROR' });
    return;
  }

  // Operational AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`AppError [${err.code}]:`, { message: err.message, stack: err.stack });
    }
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
    return;
  }

  // Unknown / programming errors
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : String(err),
    code: 'INTERNAL_ERROR',
  });
}
