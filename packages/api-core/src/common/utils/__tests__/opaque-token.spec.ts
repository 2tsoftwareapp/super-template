import { describe, expect, it } from 'vitest';

import { generateOpaqueToken, hashOpaqueToken } from '../opaque-token';

describe('opaque-token', () => {
  it('generates a 64-character hex token (32 random bytes)', () => {
    const token = generateOpaqueToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates a different token on each call', () => {
    expect(generateOpaqueToken()).not.toBe(generateOpaqueToken());
  });

  it('hashes deterministically with sha256 hex', () => {
    const hash = hashOpaqueToken('plain-token');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashOpaqueToken('plain-token')).toBe(hash);
  });

  it('produces different hashes for different inputs', () => {
    expect(hashOpaqueToken('a')).not.toBe(hashOpaqueToken('b'));
  });
});
