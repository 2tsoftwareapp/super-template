import type { NextRequest } from "next/server";

import { stripTokensFromAuthEnvelope } from "@repo/web-core/auth/sanitize-response";
import { NextResponse } from "next/server";

import type { ApiEnvelope } from "@/lib/api-types";

import { hasAdminAppAccess } from "@/lib/admin-resources";
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
    user: { roles: string[] };
    permissions: string[];
    session: unknown;
    organizationId: string | null;
  }> | null;

  if (
    !meResponse.ok ||
    !mePayload?.data ||
    !hasAdminAppAccess({
      roles: mePayload.data.user.roles,
      permissions: mePayload.data.permissions,
    })
  ) {
    const response = NextResponse.json(
      {
        error: {
          code: "AUTH_FORBIDDEN",
          message: "This account does not have admin access",
          details: null,
        },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 403 },
    );
    clearAuthCookies(response);
    return response;
  }

  const nextResponse = NextResponse.json(
    stripTokensFromAuthEnvelope(mePayload),
    { status: 200 },
  );

  setAuthCookies(nextResponse, {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  });

  return nextResponse;
}
