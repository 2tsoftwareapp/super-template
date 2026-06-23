import { createVerify, generateKeyPairSync } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { buildAppleClientSecret } from '../apple-client-secret';

describe('buildAppleClientSecret', () => {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });
  const privateKeyPem = privateKey
    .export({ type: 'pkcs8', format: 'pem' })
    .toString();

  it('produces a JWT with a verifiable ES256 signature and expected claims', () => {
    const jwt = buildAppleClientSecret({
      teamId: 'TEAM123',
      clientId: 'com.example.service',
      keyId: 'KEY123',
      privateKeyPem,
    });

    const [headerSegment, payloadSegment, signatureSegment] = jwt.split('.');
    const header = JSON.parse(
      Buffer.from(headerSegment!, 'base64url').toString('utf8'),
    );
    const payload = JSON.parse(
      Buffer.from(payloadSegment!, 'base64url').toString('utf8'),
    );

    expect(header).toEqual({ alg: 'ES256', kid: 'KEY123' });
    expect(payload.iss).toBe('TEAM123');
    expect(payload.sub).toBe('com.example.service');
    expect(payload.aud).toBe('https://appleid.apple.com');
    expect(payload.exp - payload.iat).toBe(3600);

    const signingInput = `${headerSegment}.${payloadSegment}`;
    const signature = Buffer.from(signatureSegment!, 'base64url');
    const isValid = createVerify('SHA256')
      .update(signingInput)
      .end()
      .verify({ key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);

    expect(isValid).toBe(true);
  });

  it('respects a custom ttl', () => {
    const jwt = buildAppleClientSecret({
      teamId: 'TEAM123',
      clientId: 'com.example.service',
      keyId: 'KEY123',
      privateKeyPem,
      ttlSeconds: 60,
    });
    const payloadSegment = jwt.split('.')[1]!;
    const payload = JSON.parse(
      Buffer.from(payloadSegment, 'base64url').toString('utf8'),
    );
    expect(payload.exp - payload.iat).toBe(60);
  });
});
