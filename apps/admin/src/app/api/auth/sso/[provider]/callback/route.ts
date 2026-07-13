import type { NextRequest } from "next/server";

import { stripTokensFromAuthEnvelope } from "@repo/web-server/auth/sanitize-response";
import { NextResponse } from "next/server";

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

  const payload = (await response.json().catch(() => null)) as {
    data?: { exchangeCode?: string };
  } | null;

  if (!response.ok || !payload?.data?.exchangeCode) {
    const nextResponse = NextResponse.json(payload ?? { success: false }, {
      status: response.status,
    });
    clearAuthCookies(nextResponse);
    return nextResponse;
  }

  const exchangeResponse = await callBackend({
    path: "auth/sso/exchange",
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({ code: payload.data.exchangeCode }),
  });

  const exchangePayload = (await exchangeResponse.json().catch(() => null)) as {
    data?: { accessToken?: string; refreshToken?: string };
  } | null;

  const nextResponse = NextResponse.json(
    stripTokensFromAuthEnvelope(exchangePayload) ?? { success: exchangeResponse.ok },
    { status: exchangeResponse.ok ? 200 : exchangeResponse.status },
  );

  if (
    exchangeResponse.ok &&
    exchangePayload?.data?.accessToken &&
    exchangePayload?.data?.refreshToken
  ) {
    setAuthCookies(nextResponse, {
      accessToken: exchangePayload.data.accessToken,
      refreshToken: exchangePayload.data.refreshToken,
    });
  } else {
    clearAuthCookies(nextResponse);
  }

  return nextResponse;
}
