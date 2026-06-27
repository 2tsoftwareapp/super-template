import type { NextRequest } from "next/server";

import { stripTokensFromAuthEnvelope } from "@repo/web-core/auth/sanitize-response";
import { NextResponse } from "next/server";

import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { callBackend } from "@/lib/server/backend";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const response = await callBackend({
    path: `auth/sso/${provider}/callback?code=${code}&state=${state}`,
    method: "GET",
    headers: new Headers({ accept: "application/json" }),
  });

  let responseData: Record<string, unknown> | null = null;
  try {
    responseData = (await response.json()) as Record<string, unknown>;
  } catch {
    // No JSON body from backend
  }

  const payload = responseData as {
    data?: { accessToken?: string; refreshToken?: string };
  } | null;

  const nextResponse = NextResponse.json(
    stripTokensFromAuthEnvelope(payload) ?? { success: response.ok },
    { status: response.ok ? 200 : response.status },
  );

  if (response.ok && payload?.data?.accessToken && payload?.data?.refreshToken) {
    setAuthCookies(nextResponse, {
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
    });
  } else {
    clearAuthCookies(nextResponse);
  }

  return nextResponse;
}
