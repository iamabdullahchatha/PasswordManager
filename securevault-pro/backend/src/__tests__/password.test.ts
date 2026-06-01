import { hashPassword, comparePassword, assessPasswordStrength, generatePassword } from '../utils/password';

describe('Password Utilities', () => {
  describe('hashPassword / comparePassword', () => {
    it('hashes password and verifies it correctly', async () => {
      const plain  = 'MyP@ssw0rd!';
      const hashed = await hashPassword(plain);
      expect(hashed).not.toBe(plain);
      expect(hashed.startsWith('$2')).toBe(true);
      await expect(comparePassword(plain, hashed)).resolves.toBe(true);
    });

    it('rejects wrong password', async () => {
      const hashed = await hashPassword('correct');
      await expect(comparePassword('wrong', hashed)).resolves.toBe(false);
    });

    it('produces different hashes for the same input (salted)', async () => {
      const a = await hashPassword('same');
      const b = await hashPassword('same');
      expect(a).not.toBe(b);
    });
  });

  describe('assessPasswordStrength', () => {
    it('rates a weak password as weak', () => {
      expect(assessPasswordStrength('abc').level).toBe('weak');
    });

    it('rates a strong password as strong or very-strong', () => {
      const { level } = assessPasswordStrength('Tr0ub4dor&3#xZ!');
      expect(['strong', 'very-strong']).toContain(level);
    });

    it('penalises common patterns', () => {
      const withPattern    = assessPasswordStrength('Password1!');
      const withoutPattern = assessPasswordStrength('X7kP!mQ9#w');
      expect(withPattern.score).toBeLessThan(withoutPattern.score);
    });

    it('rewards length', () => {
      const short = assessPasswordStrength('Aa1!xxxx');
      const long  = assessPasswordStrength('Aa1!xxxxxxxxxxxxxxxxxx');
      expect(long.score).toBeGreaterThan(short.score);
    });
  });

  describe('generatePassword', () => {
    it('generates a password of the requested length', () => {
      expect(generatePassword({ length: 20 })).toHaveLength(20);
      expect(generatePassword({ length: 8 })).toHaveLength(8);
    });

    it('generates unique passwords', () => {
      const passwords = Array.from({ length: 50 }, () => generatePassword({ length: 16 }));
      const unique    = new Set(passwords);
      expect(unique.size).toBe(50);
    });

    it('respects character type flags', () => {
      const noUpper = generatePassword({ uppercase: false, lowercase: true, numbers: true, symbols: false, length: 30 });
      expect(noUpper).toMatch(/^[a-z0-9]+$/);

      const numbersOnly = generatePassword({ uppercase: false, lowercase: false, numbers: true, symbols: false, length: 30 });
      expect(numbersOnly).toMatch(/^[0-9]+$/);
    });

    it('throws when no character type is selected', () => {
      expect(() => generatePassword({ uppercase: false, lowercase: false, numbers: false, symbols: false })).toThrow();
    });
  });
});
