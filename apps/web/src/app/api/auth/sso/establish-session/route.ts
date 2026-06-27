import type { NextRequest } from "next/server";

import { stripTokensFromAuthEnvelope } from "@repo/web-core/auth/sanitize-response";
import { NextResponse } from "next/server";

import type { ApiEnvelope } from "@/lib/api-types";

import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { callBackend, enforceOrigin } from "@/lib/server/backend";

type EstablishSessionInput = {
  exchangeCode?: string;
};

export async function POST(request: NextRequest) {
  const originFailure = enforceOrigin(request);
  if (originFailure) {
    return originFailure;
  }

  const body = (await request.json()) as EstablishSessionInput;

  if (!body.exchangeCode) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "exchangeCode is required",
          details: null,
        },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 400 },
    );
  }

  const exchangeResponse = await callBackend({
    path: "auth/sso/exchange",
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({ code: body.exchangeCode }),
  });

  const exchangePayload = (await exchangeResponse.json().catch(() => null)) as ApiEnvelope<{
    accessToken?: string;
    refreshToken?: string;
  }> | null;

  const accessToken = exchangePayload?.data?.accessToken;
  const refreshToken = exchangePayload?.data?.refreshToken;

  if (!exchangeResponse.ok || !accessToken || !refreshToken) {
    const response = NextResponse.json(
      exchangePayload ?? {
        error: {
          code: "SSO_EXCHANGE_INVALID",
          message: "Unable to exchange SSO session",
          details: null,
        },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: exchangeResponse.ok ? 401 : exchangeResponse.status },
    );
    clearAuthCookies(response);
    return response;
  }

  const meResponse = await callBackend({
    path: "auth/me",
    method: "GET",
    accessToken,
  });

  const mePayload = (await meResponse.json().catch(() => null)) as ApiEnvelope<{
    user: unknown;
    permissions: string[];
    session: unknown;
    organizationId: string | null;
  }> | null;

  const nextResponse = NextResponse.json(
    stripTokensFromAuthEnvelope(mePayload) ?? {
      error: {
        code: "AUTH_UNAUTHORIZED",
        message: "Invalid SSO session",
        details: null,
      },
      meta: { requestId: crypto.randomUUID() },
    },
    { status: meResponse.ok ? 200 : meResponse.status },
  );

  if (meResponse.ok) {
    setAuthCookies(nextResponse, { accessToken, refreshToken });
  } else {
    clearAuthCookies(nextResponse);
  }

  return nextResponse;
}
