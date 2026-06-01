import crypto from 'crypto';
import { AppError } from '../utils/AppError';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = parseInt(process.env.ENCRYPTION_IV_LENGTH ?? '16', 10);
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new AppError(
      'ENCRYPTION_KEY must be set and be exactly 64 hex characters (32 bytes)',
      500,
      'ENCRYPTION_CONFIG_ERROR',
    );
  }
  return Buffer.from(keyHex, 'hex');
}

export interface EncryptedPayload {
  ciphertext: string; // hex
  iv: string;         // hex
  tag: string;        // hex
}

export function encrypt(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM;

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decrypt(payload: EncryptedPayload): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const ciphertext = Buffer.from(payload.ciphertext, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM;
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new AppError('Decryption failed — data may be corrupted or tampered', 500, 'DECRYPTION_ERROR');
  }
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
