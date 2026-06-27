import type { NextRequest } from "next/server";

import { stripTokensFromAuthEnvelope } from "@repo/web-core/auth/sanitize-response";
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
  const nextResponse = NextResponse.json(
    stripTokensFromAuthEnvelope(payload) ?? payload,
    { status: response.status },
  );

  if (response.ok && payload.data?.accessToken && payload.data?.refreshToken) {
    setAuthCookies(nextResponse, {
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
    });
  } else {
    clearAuthCookies(nextResponse);
  }

  return nextResponse;
}
