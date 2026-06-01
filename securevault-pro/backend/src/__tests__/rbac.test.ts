import { Response, NextFunction } from 'express';
import { authorize, isSelf } from '../middleware/rbac.middleware';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth.middleware';

function mockReq(role: string, userId = 'user-1', params: Record<string, string> = {}): AuthRequest {
  return { user: { id: userId, role, sessionId: 'sess' }, params } as unknown as AuthRequest;
}

function mockRes(): Partial<Response> {
  return {};
}

function mockNext(): jest.Mock {
  return jest.fn();
}

describe('RBAC Middleware', () => {
  describe('authorize()', () => {
    it('allows USER role when USER is required', () => {
      const next = mockNext();
      authorize('USER')(mockReq('USER'), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('allows ADMIN role when USER is required (hierarchy)', () => {
      const next = mockNext();
      authorize('USER')(mockReq('ADMIN'), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('allows SUPER_ADMIN for any role requirement', () => {
      const next = mockNext();
      authorize('ADMIN')(mockReq('SUPER_ADMIN'), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('blocks USER from ADMIN-only routes', () => {
      const next = mockNext();
      authorize('ADMIN')(mockReq('USER'), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const err: AppError = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
    });

    it('blocks USER from SUPER_ADMIN-only routes', () => {
      const next = mockNext();
      authorize('SUPER_ADMIN')(mockReq('USER'), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('blocks ADMIN from SUPER_ADMIN-only routes', () => {
      const next = mockNext();
      authorize('SUPER_ADMIN')(mockReq('ADMIN'), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('isSelf()', () => {
    it('allows access to own resource', () => {
      const next = mockNext();
      isSelf('id')(mockReq('USER', 'user-1', { id: 'user-1' }), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('allows ADMIN to access any user resource', () => {
      const next = mockNext();
      isSelf('id')(mockReq('ADMIN', 'admin-1', { id: 'user-other' }), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith();
    });

    it('blocks USER from accessing another user resource', () => {
      const next = mockNext();
      isSelf('id')(mockReq('USER', 'user-1', { id: 'user-other' }), mockRes() as Response, next as unknown as NextFunction);
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const err: AppError = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
    });
  });
});
