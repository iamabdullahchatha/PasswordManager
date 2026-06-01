import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function secureRandomInt(max: number): number {
  if (max <= 1) return 0;
  const min = (2 ** 32) % max;
  let rand: number;
  do {
    rand = crypto.randomBytes(4).readUInt32BE(0);
  } while (rand < min);
  return rand % max;
}

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface PasswordStrengthResult {
  score: number;          // 0–100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
}

export function assessPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8)  score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;
  else if (password.length < 8) feedback.push('Use at least 8 characters');

  if (/[A-Z]/.test(password)) score += 10;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 10;
  else feedback.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score += 10;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  else feedback.push('Add special characters');

  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8)  score += 5;
  if (uniqueChars >= 12) score += 5;

  const commonPatterns = [/(.)\1{2,}/, /123/, /abc/i, /qwerty/i, /password/i];
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score = Math.max(0, score - 15);
      feedback.push('Avoid common patterns');
      break;
    }
  }

  const clampedScore = Math.min(100, Math.max(0, score));
  let level: PasswordStrengthResult['level'];

  if (clampedScore < 20)      level = 'weak';
  else if (clampedScore < 40) level = 'fair';
  else if (clampedScore < 60) level = 'good';
  else if (clampedScore < 80) level = 'strong';
  else                        level = 'very-strong';

  return { score: clampedScore, level, feedback };
}

export function generatePassword(options: {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  excludeAmbiguous?: boolean;
} = {}): string {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false,
  } = options;

  const upper = excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  const nums  = excludeAmbiguous ? '23456789' : '0123456789';
  const syms  = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  const required: string[] = [];

  if (uppercase) { charset += upper;  required.push(upper[secureRandomInt(upper.length)]); }
  if (lowercase) { charset += lower;  required.push(lower[secureRandomInt(lower.length)]); }
  if (numbers)   { charset += nums;   required.push(nums[secureRandomInt(nums.length)]); }
  if (symbols)   { charset += syms;   required.push(syms[secureRandomInt(syms.length)]); }

  if (!charset) throw new Error('At least one character type must be selected');

  const randomChars = Array.from({ length: length - required.length }, () =>
    charset[secureRandomInt(charset.length)],
  );

  const all = [...required, ...randomChars];

  // Fisher-Yates shuffle with cryptographically secure randomness
  for (let i = all.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.join('');
}
