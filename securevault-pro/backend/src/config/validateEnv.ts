/**
 * Validates all required environment variables on startup.
 * Throws a descriptive error (not an AppError) so the process crashes
 * before accepting any traffic with a bad config.
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const invalid: string[] = [];

  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
  ] as const;

  for (const key of required) {
    if (!process.env[key]) missing.push(key);
  }

  if (missing.length > 0) {
    throw new Error(
      `[Config] Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
      `Copy .env.example to .env and fill in the values.`,
    );
  }

  // ENCRYPTION_KEY must be exactly 64 hex chars (32 bytes for AES-256)
  const encKey = process.env.ENCRYPTION_KEY!;
  if (encKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(encKey)) {
    invalid.push('ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes)');
  }

  // JWT secrets should be at least 32 characters
  if ((process.env.JWT_ACCESS_SECRET?.length ?? 0) < 32) {
    invalid.push('JWT_ACCESS_SECRET must be at least 32 characters');
  }
  if ((process.env.JWT_REFRESH_SECRET?.length ?? 0) < 32) {
    invalid.push('JWT_REFRESH_SECRET must be at least 32 characters');
  }
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    invalid.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values');
  }

  if (invalid.length > 0) {
    throw new Error(
      `[Config] Invalid environment variable values:\n  ${invalid.join('\n  ')}`,
    );
  }
}
