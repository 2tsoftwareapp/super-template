import type { NextResponse } from "next/server";

const BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSessionCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  response.cookies.set("access_token", tokens.accessToken, { ...BASE, maxAge: 60 * 15 });
  response.cookies.set("refresh_token", tokens.refreshToken, {
    ...BASE,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  for (const name of ["access_token", "refresh_token"]) {
    response.cookies.set(name, "", { ...BASE, maxAge: 0 });
  }
}
