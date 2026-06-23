import { describe, expect, it } from 'vitest';

import { decryptTotpSecret, encryptTotpSecret } from '../totp-encryption';

describe('totp-encryption', () => {
  const key = 'a'.repeat(64);

  it('round-trips a secret through encrypt/decrypt', () => {
    const secret = Buffer.from('super-secret-totp-key');
    const encrypted = encryptTotpSecret(secret, key);

    expect(decryptTotpSecret(encrypted, key)).toEqual(secret);
  });

  it('produces a different ciphertext and iv on each call', () => {
    const secret = Buffer.from('super-secret-totp-key');
    const first = encryptTotpSecret(secret, key);
    const second = encryptTotpSecret(secret, key);

    expect(first.iv).not.toBe(second.iv);
    expect(first.ciphertext).not.toBe(second.ciphertext);
  });

  it('fails to decrypt with the wrong key', () => {
    const secret = Buffer.from('super-secret-totp-key');
    const encrypted = encryptTotpSecret(secret, key);
    const wrongKey = 'b'.repeat(64);

    expect(() => decryptTotpSecret(encrypted, wrongKey)).toThrow();
  });
});
