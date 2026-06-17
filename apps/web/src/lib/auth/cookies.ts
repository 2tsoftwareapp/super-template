import type { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { env, isSecureCookie } from "@/lib/env";

export const ACCESS_TOKEN_COOKIE = "st_access_token";
export const REFRESH_TOKEN_COOKIE = "st_refresh_token";
export const CSRF_TOKEN_COOKIE = "csrf_token";

const baseCookieOptions = {
  httpOnly: true,
  domain: env.COOKIE_DOMAIN,
  sameSite: env.COOKIE_SAMESITE,
  path: "/",
  secure: isSecureCookie,
};

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

export const readAuthCookies = async () => {
  const store = await cookies();

  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
    csrfToken: store.get(CSRF_TOKEN_COOKIE)?.value ?? null,
  };
};

interface TokenPayload {
  accessToken: string;
  refreshToken: string;
}

export const setAuthCookies = (
  response: NextResponse,
  payload: TokenPayload,
  csrfToken?: string,
) => {
  const resolvedCsrfToken =
    csrfToken && isValidCsrfToken(csrfToken) ? csrfToken : createCsrfToken();

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    payload.accessToken,
    baseCookieOptions,
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    payload.refreshToken,
    baseCookieOptions,
  );
  response.cookies.set(CSRF_TOKEN_COOKIE, resolvedCsrfToken, {
    ...baseCookieOptions,
    httpOnly: false,
  });
};

export const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
  response.cookies.set(CSRF_TOKEN_COOKIE, "", {
    ...baseCookieOptions,
    httpOnly: false,
    maxAge: 0,
  });
};
