import { encrypt, decrypt, generateSecureToken, hashSha256 } from '../config/encryption';

describe('Encryption', () => {
  describe('encrypt / decrypt', () => {
    it('round-trips plaintext correctly', () => {
      const original = 'MyS3cretP@ssw0rd!';
      const payload  = encrypt(original);
      expect(decrypt(payload)).toBe(original);
    });

    it('produces different ciphertext for identical plaintext (unique IVs)', () => {
      const text = 'same-plaintext';
      const a = encrypt(text);
      const b = encrypt(text);
      expect(a.ciphertext).not.toBe(b.ciphertext);
      expect(a.iv).not.toBe(b.iv);
    });

    it('stores ciphertext, iv, and tag as hex strings', () => {
      const { ciphertext, iv, tag } = encrypt('hello');
      expect(ciphertext).toMatch(/^[0-9a-f]+$/);
      expect(iv).toMatch(/^[0-9a-f]+$/);
      expect(tag).toMatch(/^[0-9a-f]+$/);
    });

    it('throws on tampered ciphertext', () => {
      const payload = encrypt('data');
      // Flip the last hex character to guarantee a change
      const last    = payload.ciphertext.slice(-1);
      const newLast = last === 'f' ? '0' : 'f';
      const tampered = { ...payload, ciphertext: payload.ciphertext.slice(0, -1) + newLast };
      expect(() => decrypt(tampered)).toThrow();
    });

    it('throws on tampered auth tag', () => {
      const payload = encrypt('data');
      const tampered = { ...payload, tag: 'ff'.repeat(16) };
      expect(() => decrypt(tampered)).toThrow();
    });

    it('handles empty string', () => {
      const payload = encrypt('');
      expect(decrypt(payload)).toBe('');
    });

    it('handles unicode characters', () => {
      const unicode = '密码123 café Ñoño 🔐';
      expect(decrypt(encrypt(unicode))).toBe(unicode);
    });
  });

  describe('generateSecureToken', () => {
    it('returns a hex string of correct length', () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it('generates unique tokens', () => {
      const tokens = Array.from({ length: 20 }, () => generateSecureToken(32));
      const unique  = new Set(tokens);
      expect(unique.size).toBe(20);
    });
  });

  describe('hashSha256', () => {
    it('produces a consistent 64-char hex hash', () => {
      const hash = hashSha256('test');
      expect(hash).toHaveLength(64);
      expect(hashSha256('test')).toBe(hash); // deterministic
    });

    it('different inputs produce different hashes', () => {
      expect(hashSha256('a')).not.toBe(hashSha256('b'));
    });
  });
});
