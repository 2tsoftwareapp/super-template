import type { NextResponse } from "next/server";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

import { isSecureCookie } from "@/lib/env";

export const ACCESS_TOKEN_COOKIE = "st_access_token";
export const REFRESH_TOKEN_COOKIE = "st_refresh_token";
export const CSRF_TOKEN_COOKIE = "csrf_token";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: isSecureCookie,
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
  const resolvedCsrfToken = csrfToken ?? randomUUID();

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
