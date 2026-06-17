import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';

export const hashPassword = (value: string): Promise<string> =>
  argon2.hash(value, {
    type: argon2.argon2id,
  });

export const verifyPassword = (hash: string, value: string): Promise<boolean> =>
  argon2.verify(hash, value);

export const hashRefreshToken = hashPassword;
export const verifyRefreshTokenHash = verifyPassword;

export const generateOpaqueToken = (): string =>
  randomBytes(32).toString('hex');

export const hashOpaqueToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
