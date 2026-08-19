import "server-only";

import type { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const DEFAULT_ACCESS_TOKEN_COOKIE = "st_access_token";
export const DEFAULT_REFRESH_TOKEN_COOKIE = "st_refresh_token";
export const DEFAULT_CSRF_TOKEN_COOKIE = "csrf_token";

const CSRF_SEPARATOR = ".";
const CSRF_HMAC_ALGORITHM = "sha256";

export interface AuthCookieNameOptions {
  accessToken?: string;
  refreshToken?: string;
  csrf?: string;
}

export interface AuthCookieOptions {
  cookieDomain?: string | undefined;
  cookieSameSite?: "lax" | "strict" | "none";
  cookieSecure?: boolean;
  csrfSecret?: string | null;
  cookieNames?: AuthCookieNameOptions;
  /** When true, unsigned CSRF tokens are rejected (staging/production). */
  requireSignedCsrf?: boolean;
}

export interface AuthTokenPayload {
  accessToken: string;
  refreshToken: string;
}

export interface AuthCookieHelpers {
  accessTokenCookie: string;
  refreshTokenCookie: string;
  csrfTokenCookie: string;
  createCsrfToken: () => string;
  isValidCsrfToken: (value: string) => boolean;
  readAuthCookies: () => Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    csrfToken: string | null;
  }>;
  setCsrfCookie: (response: NextResponse, csrfToken?: string) => string;
  setAuthCookies: (response: NextResponse, payload: AuthTokenPayload, csrfToken?: string) => void;
  clearSessionCookies: (response: NextResponse) => void;
  clearAuthCookies: (response: NextResponse) => void;
}

export const createAuthCookieHelpers = ({
  cookieDomain,
  cookieSameSite = "lax",
  cookieSecure = false,
  csrfSecret,
  cookieNames,
  requireSignedCsrf = false,
}: AuthCookieOptions): AuthCookieHelpers => {
  const accessTokenCookie = cookieNames?.accessToken ?? DEFAULT_ACCESS_TOKEN_COOKIE;
  const refreshTokenCookie = cookieNames?.refreshToken ?? DEFAULT_REFRESH_TOKEN_COOKIE;
  const csrfTokenCookie = cookieNames?.csrf ?? DEFAULT_CSRF_TOKEN_COOKIE;

  const baseCookieOptions = {
    httpOnly: true,
    domain: cookieDomain,
    sameSite: cookieSameSite,
    path: "/",
    secure: cookieSecure,
  };

  const signCsrfNonce = (nonce: string) => {
    if (!csrfSecret) {
      return nonce;
    }

    const signature = createHmac(CSRF_HMAC_ALGORITHM, csrfSecret).update(nonce).digest("base64url");

    return `${nonce}${CSRF_SEPARATOR}${signature}`;
  };

  const createCsrfToken = () => signCsrfNonce(randomUUID());

  const isValidCsrfToken = (value: string) => {
    if (!value) {
      return false;
    }

    if (requireSignedCsrf && !csrfSecret) {
      return false;
    }

    if (!csrfSecret) {
      return value.length > 0;
    }

    const [nonce, signature] = value.split(CSRF_SEPARATOR);

    if (!nonce || !signature) {
      return false;
    }

    const expectedSignature = createHmac(CSRF_HMAC_ALGORITHM, csrfSecret)
      .update(nonce)
      .digest("base64url");

    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  };

  const readAuthCookies = async () => {
    const store = await cookies();

    return {
      accessToken: store.get(accessTokenCookie)?.value ?? null,
      refreshToken: store.get(refreshTokenCookie)?.value ?? null,
      csrfToken: store.get(csrfTokenCookie)?.value ?? null,
    };
  };

  const setCsrfCookie = (response: NextResponse, csrfToken?: string) => {
    const resolvedCsrfToken =
      csrfToken && isValidCsrfToken(csrfToken) ? csrfToken : createCsrfToken();

    response.cookies.set(csrfTokenCookie, resolvedCsrfToken, {
      ...baseCookieOptions,
      httpOnly: false,
    });

    return resolvedCsrfToken;
  };

  const setAuthCookies = (
    response: NextResponse,
    payload: AuthTokenPayload,
    csrfToken?: string,
  ) => {
    setCsrfCookie(response, csrfToken);
    response.cookies.set(accessTokenCookie, payload.accessToken, baseCookieOptions);
    response.cookies.set(refreshTokenCookie, payload.refreshToken, baseCookieOptions);
  };

  const clearSessionCookies = (response: NextResponse) => {
    response.cookies.set(accessTokenCookie, "", {
      ...baseCookieOptions,
      maxAge: 0,
    });
    response.cookies.set(refreshTokenCookie, "", {
      ...baseCookieOptions,
      maxAge: 0,
    });
  };

  const clearAuthCookies = (response: NextResponse) => {
    clearSessionCookies(response);
    response.cookies.set(csrfTokenCookie, "", {
      ...baseCookieOptions,
      httpOnly: false,
      maxAge: 0,
    });
  };

  return {
    accessTokenCookie,
    refreshTokenCookie,
    csrfTokenCookie,
    createCsrfToken,
    isValidCsrfToken,
    readAuthCookies,
    setCsrfCookie,
    setAuthCookies,
    clearSessionCookies,
    clearAuthCookies,
  };
};
