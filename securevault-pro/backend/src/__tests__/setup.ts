// Load test environment variables before any module imports
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/securevault_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-characters-long-abc123';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-characters-long-xyz789';
process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 64 hex chars = 32 bytes
process.env.BCRYPT_ROUNDS = '4'; // low rounds for test speed
process.env.EMAIL_DEV_MODE = 'true';
