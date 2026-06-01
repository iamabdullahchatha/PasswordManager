export interface PasswordStrengthResult {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  label: string;
  color: string;
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
  else feedback.push('Add special characters (!@#$...)');

  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8)  score += 5;
  if (uniqueChars >= 12) score += 5;

  const commonPatterns = [/(.)\1{2,}/, /123/, /abc/i, /qwerty/i, /password/i];
  for (const p of commonPatterns) {
    if (p.test(password)) {
      score = Math.max(0, score - 15);
      feedback.push('Avoid common patterns');
      break;
    }
  }

  const clamped = Math.min(100, Math.max(0, score));
  let level: PasswordStrengthResult['level'];
  let label: string;
  let color: string;

  if (clamped < 20)      { level = 'weak';       label = 'Weak';        color = 'bg-red-500'; }
  else if (clamped < 40) { level = 'fair';        label = 'Fair';        color = 'bg-orange-400'; }
  else if (clamped < 60) { level = 'good';        label = 'Good';        color = 'bg-yellow-400'; }
  else if (clamped < 80) { level = 'strong';      label = 'Strong';      color = 'bg-green-500'; }
  else                   { level = 'very-strong'; label = 'Very Strong'; color = 'bg-emerald-500'; }

  return { score: clamped, level, label, color, feedback };
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

  if (uppercase) { charset += upper; required.push(upper[Math.floor(Math.random() * upper.length)]); }
  if (lowercase) { charset += lower; required.push(lower[Math.floor(Math.random() * lower.length)]); }
  if (numbers)   { charset += nums;  required.push(nums[Math.floor(Math.random() * nums.length)]); }
  if (symbols)   { charset += syms;  required.push(syms[Math.floor(Math.random() * syms.length)]); }

  if (!charset) charset = upper + lower + nums;

  const random = Array.from({ length: Math.max(0, length - required.length) }, () =>
    charset[Math.floor(Math.random() * charset.length)],
  );

  const all = [...required, ...random];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.join('');
}
