import type { Request, Response } from "express";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { env, isSecureCookie } from "./env";

export const ACCESS_TOKEN_COOKIE = "st_access_token";
export const REFRESH_TOKEN_COOKIE = "st_refresh_token";
export const CSRF_TOKEN_COOKIE = "csrf_token";

const baseCookieOptions = {
  httpOnly: true,
  domain: env.COOKIE_DOMAIN,
  sameSite: env.COOKIE_SAMESITE,
  path: "/",
  secure: isSecureCookie,
} as const;

const CSRF_SEPARATOR = ".";
const CSRF_HMAC_ALGORITHM = "sha256";

const signCsrfNonce = (nonce: string) => {
  if (!env.CSRF_SECRET) {
    return nonce;
  }

  const signature = createHmac(CSRF_HMAC_ALGORITHM, env.CSRF_SECRET)
    .update(nonce)
    .digest("base64url");

  return `${nonce}${CSRF_SEPARATOR}${signature}`;
};

export const createCsrfToken = () => signCsrfNonce(randomUUID());

export const isValidCsrfToken = (value: string) => {
  if (!env.CSRF_SECRET) {
    return value.length > 0;
  }

  const [nonce, signature] = value.split(CSRF_SEPARATOR);

  if (!nonce || !signature) {
    return false;
  }

  const expectedSignature = createHmac(CSRF_HMAC_ALGORITHM, env.CSRF_SECRET)
    .update(nonce)
    .digest("base64url");

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
};

export const readAuthCookies = (req: Request) => ({
  accessToken: (req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined) ?? null,
  refreshToken: (req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined) ?? null,
  csrfToken: (req.cookies?.[CSRF_TOKEN_COOKIE] as string | undefined) ?? null,
});

interface TokenPayload {
  accessToken: string;
  refreshToken: string;
}

export const setAuthCookies = (
  res: Response,
  payload: TokenPayload,
  csrfToken?: string,
) => {
  const resolvedCsrfToken =
    csrfToken && isValidCsrfToken(csrfToken) ? csrfToken : createCsrfToken();

  res.cookie(ACCESS_TOKEN_COOKIE, payload.accessToken, baseCookieOptions);
  res.cookie(REFRESH_TOKEN_COOKIE, payload.refreshToken, baseCookieOptions);
  res.cookie(CSRF_TOKEN_COOKIE, resolvedCsrfToken, {
    ...baseCookieOptions,
    httpOnly: false,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseCookieOptions);
  res.clearCookie(CSRF_TOKEN_COOKIE, {
    ...baseCookieOptions,
    httpOnly: false,
  });
};
