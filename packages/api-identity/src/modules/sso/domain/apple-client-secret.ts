import { createPrivateKey, createSign } from 'node:crypto';

const APPLE_AUDIENCE = 'https://appleid.apple.com';

const base64UrlEncode = (input: Buffer | string): string =>
  Buffer.from(input).toString('base64url');

// Apple requires the OAuth client_secret to be a JWT signed with the developer's
// ES256 key (team/key id in the header), not a static string. Built fresh per
// exchange rather than cached, since it's cheap and avoids tracking expiry state.
export const buildAppleClientSecret = (params: {
  teamId: string;
  clientId: string;
  keyId: string;
  privateKeyPem: string;
  ttlSeconds?: number;
}): string => {
  const header = { alg: 'ES256', kid: params.keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: params.teamId,
    iat: now,
    exp: now + (params.ttlSeconds ?? 3600),
    aud: APPLE_AUDIENCE,
    sub: params.clientId,
  };

  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const privateKey = createPrivateKey(params.privateKeyPem);
  const sign = createSign('SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });

  return `${signingInput}.${base64UrlEncode(signature)}`;
};
