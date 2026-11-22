import type { NextResponse } from "next/server";

const BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

/** Same `15m` / `30d` format as the API's JWT_*_TTL, so cookies never outlive their token. */
function ttlSeconds(value: string | undefined, fallback: string): number {
  const match = /^(\d+)([smhd])$/.exec(value ?? fallback) ?? /^(\d+)([smhd])$/.exec(fallback);
  const unit = match?.[2];

  if (!match || !(unit === "s" || unit === "m" || unit === "h" || unit === "d")) {
    throw new Error(`Invalid TTL: ${value ?? fallback}`);
  }

  return Number(match[1]) * UNIT_SECONDS[unit];
}

export function setSessionCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  response.cookies.set("access_token", tokens.accessToken, {
    ...BASE,
    maxAge: ttlSeconds(process.env.JWT_ACCESS_TTL, "15m"),
  });
  response.cookies.set("refresh_token", tokens.refreshToken, {
    ...BASE,
    maxAge: ttlSeconds(process.env.JWT_REFRESH_TTL, "30d"),
  });
}

export function clearSessionCookies(response: NextResponse): void {
  for (const name of ["access_token", "refresh_token"]) {
    response.cookies.set(name, "", { ...BASE, maxAge: 0 });
  }
}
