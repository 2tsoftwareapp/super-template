import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import {
  readAuthCookies,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { callBackend, enforceMutationGuard } from "@/lib/server/backend";

interface SwitchOrganizationPayload {
  data?: { accessToken?: string; organizationId?: string };
  error?: unknown;
  meta?: unknown;
}

// Switching tenant re-issues the access token (new org claim); the refresh
// token is unchanged. Set the new access cookie and never expose the raw
// token to the client.
export async function POST(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  const { accessToken, refreshToken, csrfToken } = await readAuthCookies();

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      {
        error: {
          code: "AUTH_UNAUTHORIZED",
          message: "Not authenticated",
          details: null,
        },
        meta: { requestId: crypto.randomUUID() },
      },
      { status: 401 },
    );
  }

  const body: unknown = await request.json();
  const response = await callBackend({
    path: "auth/switch-organization",
    method: "POST",
    accessToken,
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as SwitchOrganizationPayload;

  if (!response.ok || !payload.data?.accessToken) {
    return NextResponse.json(payload, { status: response.status });
  }

  const nextResponse = NextResponse.json(
    {
      data: { organizationId: payload.data.organizationId },
      meta: payload.meta,
    },
    { status: response.status },
  );

  setAuthCookies(
    nextResponse,
    { accessToken: payload.data.accessToken, refreshToken },
    csrfToken ?? undefined,
  );

  return nextResponse;
}
