import { createSign, generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  type Jwk,
  OidcVerificationError,
  verifyOidcIdToken,
} from '../oidc-verify';

const base64UrlEncode = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64url');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});
const jwk: Jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'key-1' } as Jwk;

const signIdToken = (payload: Record<string, unknown>): string => {
  const header = { alg: 'RS256', kid: 'key-1' };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const signature = createSign('RSA-SHA256')
    .update(signingInput)
    .end()
    .sign(privateKey);

  return `${signingInput}.${base64UrlEncode(signature)}`;
};

const basePayload = () => {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: 'https://accounts.example.com',
    aud: 'client-123',
    sub: 'user-subject',
    iat: now,
    exp: now + 3600,
    nonce: 'expected-nonce',
    email: 'user@example.com',
    email_verified: true,
  };
};

const verifyParams = (idToken: string, overrides: Partial<Parameters<typeof verifyOidcIdToken>[0]> = {}) => ({
  idToken,
  jwks: [jwk],
  issuers: ['https://accounts.example.com'],
  audience: 'client-123',
  nonce: 'expected-nonce',
  ...overrides,
});

describe('verifyOidcIdToken', () => {
  it('accepts a validly signed token matching issuer/audience/nonce', () => {
    const idToken = signIdToken(basePayload());
    const payload = verifyOidcIdToken(verifyParams(idToken));
    expect(payload.sub).toBe('user-subject');
    expect(payload.email).toBe('user@example.com');
  });

  it('rejects a tampered signature', () => {
    const idToken = signIdToken(basePayload());
    const tampered = `${idToken.slice(0, -4)}abcd`;
    expect(() => verifyOidcIdToken(verifyParams(tampered))).toThrow(
      OidcVerificationError,
    );
  });

  it('rejects an unexpected issuer', () => {
    const idToken = signIdToken({ ...basePayload(), iss: 'https://evil.example.com' });
    expect(() => verifyOidcIdToken(verifyParams(idToken))).toThrow(
      /issuer/i,
    );
  });

  it('rejects an unexpected audience', () => {
    const idToken = signIdToken({ ...basePayload(), aud: 'someone-elses-client' });
    expect(() => verifyOidcIdToken(verifyParams(idToken))).toThrow(
      /audience/i,
    );
  });

  it('rejects an expired token', () => {
    const now = Math.floor(Date.now() / 1000);
    const idToken = signIdToken({ ...basePayload(), exp: now - 120, iat: now - 200 });
    expect(() => verifyOidcIdToken(verifyParams(idToken))).toThrow(/expired/i);
  });

  it('rejects a nonce mismatch', () => {
    const idToken = signIdToken({ ...basePayload(), nonce: 'wrong-nonce' });
    expect(() => verifyOidcIdToken(verifyParams(idToken))).toThrow(/nonce/i);
  });

  it('rejects when no JWK matches the kid', () => {
    const idToken = signIdToken(basePayload());
    expect(() =>
      verifyOidcIdToken(verifyParams(idToken, { jwks: [] })),
    ).toThrow(/no matching jwk/i);
  });

  it('rejects a malformed token', () => {
    expect(() => verifyOidcIdToken(verifyParams('not-a-jwt'))).toThrow(
      OidcVerificationError,
    );
  });
});
