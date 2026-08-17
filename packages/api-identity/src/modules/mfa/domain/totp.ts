import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
// Tolerates +/- 1 step (30s) of clock drift between server and authenticator app.
const TOTP_WINDOW = 1;

export const generateTotpSecret = (): Buffer => randomBytes(20);

export const base32Encode = (buffer: Buffer): string => {
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
};

export const base32Decode = (input: string): Buffer => {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      continue;
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
};

const hotp = (secret: Buffer, counter: bigint): string => {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);

  const hmac = createHmac("sha1", secret).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;
  const binCode =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  return (binCode % 10 ** TOTP_DIGITS).toString().padStart(TOTP_DIGITS, "0");
};

const timingSafeEqualStrings = (a: string, b: string): boolean => {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
};

export const generateTotpCode = (secret: Buffer, at: Date = new Date()): string => {
  const counter = BigInt(Math.floor(at.getTime() / 1000 / TOTP_PERIOD_SECONDS));
  return hotp(secret, counter);
};

export const verifyTotpCode = (secret: Buffer, code: string, at: Date = new Date()): boolean => {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  const counter = BigInt(Math.floor(at.getTime() / 1000 / TOTP_PERIOD_SECONDS));

  for (let drift = -TOTP_WINDOW; drift <= TOTP_WINDOW; drift++) {
    const candidate = hotp(secret, counter + BigInt(drift));
    if (timingSafeEqualStrings(candidate, code)) {
      return true;
    }
  }

  return false;
};

export const buildOtpauthUri = (params: {
  secret: Buffer;
  email: string;
  issuer: string;
}): string => {
  const base32Secret = base32Encode(params.secret);
  const label = encodeURIComponent(`${params.issuer}:${params.email}`);
  const query = new URLSearchParams({
    secret: base32Secret,
    issuer: params.issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });

  return `otpauth://totp/${label}?${query.toString()}`;
};
