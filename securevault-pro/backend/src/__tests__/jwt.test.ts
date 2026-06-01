import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, getTokenExpiryDate } from '../config/jwt';
import { AppError } from '../utils/AppError';

describe('JWT Utilities', () => {
  const userId    = 'user-123';
  const role      = 'USER';
  const sessionId = 'session-abc';

  describe('Access Token', () => {
    it('signs and verifies an access token', () => {
      const token   = signAccessToken({ sub: userId, role, sessionId });
      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.role).toBe(role);
      expect(payload.sessionId).toBe(sessionId);
    });

    it('throws TOKEN_INVALID for a tampered token', () => {
      const token  = signAccessToken({ sub: userId, role, sessionId });
      const bad    = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyAccessToken(bad)).toThrow(AppError);
      try { verifyAccessToken(bad); } catch (e: any) {
        expect(e.code).toBe('TOKEN_INVALID');
      }
    });

    it('throws TOKEN_INVALID for empty string', () => {
      expect(() => verifyAccessToken('')).toThrow(AppError);
    });
  });

  describe('Refresh Token', () => {
    it('signs and verifies a refresh token', () => {
      const token   = signRefreshToken({ sub: userId, sessionId });
      const payload = verifyRefreshToken(token);
      expect(payload.sub).toBe(userId);
      expect(payload.sessionId).toBe(sessionId);
    });

    it('throws REFRESH_TOKEN_INVALID for an access token used as refresh', () => {
      const accessToken = signAccessToken({ sub: userId, role, sessionId });
      expect(() => verifyRefreshToken(accessToken)).toThrow(AppError);
    });
  });

  describe('getTokenExpiryDate', () => {
    it('calculates expiry for minutes', () => {
      const before = Date.now();
      const expiry = getTokenExpiryDate('15m');
      const after  = Date.now();
      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 15 * 60_000);
      expect(expiry.getTime()).toBeLessThanOrEqual(after  + 15 * 60_000 + 100);
    });

    it('calculates expiry for days', () => {
      const expiry = getTokenExpiryDate('7d');
      const expected = Date.now() + 7 * 86_400_000;
      expect(Math.abs(expiry.getTime() - expected)).toBeLessThan(1000);
    });

    it('throws on invalid format', () => {
      expect(() => getTokenExpiryDate('15x')).toThrow();
      expect(() => getTokenExpiryDate('abc')).toThrow();
    });
  });
});
