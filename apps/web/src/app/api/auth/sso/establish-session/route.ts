import type { NextRequest } from "next/server";

import { stripTokensFromAuthEnvelope } from "@repo/web-core/auth/sanitize-response";
import { NextResponse } from "next/server";

import type { ApiEnvelope } from "@/lib/api-types";

import { clearAuthCookies, setAuthCookies } from "@/lib/auth/cookies";
import { callBackend } from "@/lib/server/backend";

type EstablishSessionInput = {
  accessToken?: string;
  refreshToken?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as EstablishSessionInput;

  if (!body.accessToken || !body.refreshToken) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "accessToken and refreshToken are required",
          details: null,
        },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 400 },
    );
  }

  const meResponse = await callBackend({
    path: "auth/me",
    method: "GET",
    accessToken: body.accessToken,
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
    setAuthCookies(nextResponse, {
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
    });
  } else {
    clearAuthCookies(nextResponse);
  }

  return nextResponse;
}
