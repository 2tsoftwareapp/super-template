import { createPublicKey, createVerify, type JsonWebKey } from 'node:crypto';

export interface Jwk {
  kty: string;
  kid?: string;
  [key: string]: unknown;
}

export interface OidcIdTokenPayload {
  iss: string;
  aud: string | string[];
  sub: string;
  exp: number;
  iat: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean | string;
  [key: string]: unknown;
}

export class OidcVerificationError extends Error {}

interface DecodedJwt {
  header: { alg?: string; kid?: string };
  payload: OidcIdTokenPayload;
  signingInput: string;
  signature: Buffer;
}

const decodeJwt = (idToken: string): DecodedJwt => {
  const parts = idToken.split('.');

  if (parts.length !== 3) {
    throw new OidcVerificationError('Malformed ID token');
  }

  const [headerSegment, payloadSegment, signatureSegment] = parts as [
    string,
    string,
    string,
  ];

  try {
    const header = JSON.parse(
      Buffer.from(headerSegment, 'base64url').toString('utf8'),
    ) as DecodedJwt['header'];
    const payload = JSON.parse(
      Buffer.from(payloadSegment, 'base64url').toString('utf8'),
    ) as OidcIdTokenPayload;

    return {
      header,
      payload,
      signingInput: `${headerSegment}.${payloadSegment}`,
      signature: Buffer.from(signatureSegment, 'base64url'),
    };
  } catch {
    throw new OidcVerificationError('Could not parse ID token');
  }
};

export interface VerifyOidcIdTokenParams {
  idToken: string;
  jwks: Jwk[];
  issuers: string[];
  audience: string;
  nonce?: string;
  clockToleranceSeconds?: number;
}

export const verifyOidcIdToken = (
  params: VerifyOidcIdTokenParams,
): OidcIdTokenPayload => {
  const { header, payload, signingInput, signature } = decodeJwt(
    params.idToken,
  );

  if (header.alg !== 'RS256') {
    throw new OidcVerificationError(`Unsupported alg: ${String(header.alg)}`);
  }

  const jwk = params.jwks.find(
    (key) => key.kty === 'RSA' && key.kid === header.kid,
  );

  if (!jwk) {
    throw new OidcVerificationError('No matching JWK for token kid');
  }

  const publicKey = createPublicKey({
    key: jwk as unknown as JsonWebKey,
    format: 'jwk',
  });
  const verifier = createVerify('RSA-SHA256');
  verifier.update(signingInput);
  verifier.end();

  if (!verifier.verify(publicKey, signature)) {
    throw new OidcVerificationError('Invalid ID token signature');
  }

  const now = Math.floor(Date.now() / 1000);
  const tolerance = params.clockToleranceSeconds ?? 60;

  if (payload.exp + tolerance < now) {
    throw new OidcVerificationError('ID token has expired');
  }

  if (!params.issuers.includes(payload.iss)) {
    throw new OidcVerificationError('Unexpected issuer');
  }

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

  if (!audiences.includes(params.audience)) {
    throw new OidcVerificationError('Unexpected audience');
  }

  if (params.nonce !== undefined && payload.nonce !== params.nonce) {
    throw new OidcVerificationError('Nonce mismatch');
  }

  return payload;
};
