import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { AuthLoginResponse } from "@/lib/api-types";

import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { callBackend } from "@/lib/server/backend";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const pathWithParams = `auth/sso/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

  const response = await callBackend({
    path: pathWithParams,
    method: "GET",
    headers: new Headers({ accept: "application/json" }),
  });

  const payload = (await response.json().catch(() => ({}))) as AuthLoginResponse;
  const nextResponse = NextResponse.json(payload, { status: response.status });

  // Forward set-cookie headers from backend (SSO callback sets auth cookies)
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  if (response.ok && payload.data?.accessToken && payload.data?.refreshToken) {
    setAuthCookies(nextResponse, {
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
    });
  } else if (response.ok && !payload.data?.accessToken) {
    // Try to extract tokens from set-cookie headers
    // Backend may set cookies directly without response body
  } else {
    clearAuthCookies(nextResponse);
  }

  return nextResponse;
}
