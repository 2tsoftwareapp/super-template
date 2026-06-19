import type { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const ACCESS_TOKEN_COOKIE = "st_access_token";
export const REFRESH_TOKEN_COOKIE = "st_refresh_token";
export const CSRF_TOKEN_COOKIE = "csrf_token";

const CSRF_SEPARATOR = ".";
const CSRF_HMAC_ALGORITHM = "sha256";

export interface AuthCookieOptions {
  cookieDomain?: string | undefined;
  cookieSameSite?: "lax" | "strict" | "none";
  cookieSecure?: boolean;
  csrfSecret?: string | null;
}

export interface AuthTokenPayload {
  accessToken: string;
  refreshToken: string;
}

export interface AuthCookieHelpers {
  createCsrfToken: () => string;
  isValidCsrfToken: (value: string) => boolean;
  readAuthCookies: () => Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    csrfToken: string | null;
  }>;
  setAuthCookies: (
    response: NextResponse,
    payload: AuthTokenPayload,
    csrfToken?: string,
  ) => void;
  clearAuthCookies: (response: NextResponse) => void;
}

export const createAuthCookieHelpers = ({
  cookieDomain,
  cookieSameSite = "lax",
  cookieSecure = false,
  csrfSecret,
}: AuthCookieOptions): AuthCookieHelpers => {
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

    const signature = createHmac(CSRF_HMAC_ALGORITHM, csrfSecret)
      .update(nonce)
      .digest("base64url");

    return `${nonce}${CSRF_SEPARATOR}${signature}`;
  };

  const createCsrfToken = () => signCsrfNonce(randomUUID());

  const isValidCsrfToken = (value: string) => {
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
      accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
      refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
      csrfToken: store.get(CSRF_TOKEN_COOKIE)?.value ?? null,
    };
  };

  const setAuthCookies = (
    response: NextResponse,
    payload: AuthTokenPayload,
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

  const clearAuthCookies = (response: NextResponse) => {
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

  return {
    createCsrfToken,
    isValidCsrfToken,
    readAuthCookies,
    setAuthCookies,
    clearAuthCookies,
  };
};
