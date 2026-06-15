import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  readAuthCookies,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { refreshSession } from "@/lib/server/backend";

export async function POST() {
  const { refreshToken, csrfToken } = await readAuthCookies();

  if (!refreshToken) {
    const response = NextResponse.json(
      {
        error: {
          code: "AUTH_UNAUTHORIZED",
          message: "Refresh token is missing",
          details: null,
        },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  const refreshed = await refreshSession(refreshToken);

  if (!refreshed) {
    const response = NextResponse.json(
      {
        error: {
          code: "AUTH_SESSION_REVOKED",
          message: "Unable to refresh session",
          details: null,
        },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  const response = NextResponse.json(refreshed);
  setAuthCookies(response, refreshed.data, csrfToken ?? undefined);
  return response;
}
