import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { clearSessionCookies, setCsrfCookie } from "@/lib/auth/cookies";
import { callBackend, enforceMutationGuard, readAuthCookies } from "@/lib/server/backend";

interface ErrorEnvelope {
  error?: { code?: string };
}

/** Reject the request locally when the session cookie is missing. */
function unauthenticated(): NextResponse {
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

export async function PATCH(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  const { accessToken } = await readAuthCookies();

  if (!accessToken) {
    return unauthenticated();
  }

  const body = await request.text();
  const response = await callBackend({
    path: "users/me/password",
    method: "PATCH",
    accessToken,
    headers: new Headers({ "content-type": "application/json" }),
    body,
  });

  const payload: unknown = await response.json();

  /* Password change revokes all sessions on the backend. Clear the
   * frontend auth cookies so the user is forced back to the login
   * page instead of holding stale credentials. */
  if (response.ok) {
    const nextResponse = NextResponse.json(payload, { status: response.status });
    clearSessionCookies(nextResponse);
    setCsrfCookie(nextResponse);
    return nextResponse;
  }

  /* A 401 here is either an expired session or a rejected current password
   * (`AUTH_INVALID_CREDENTIALS`). Only the former should drop the session —
   * clearing cookies on a typo would sign the user out of the rotation form. */
  const failureCode = (payload as ErrorEnvelope | null)?.error?.code;

  if (response.status === 401 && failureCode !== "AUTH_INVALID_CREDENTIALS") {
    const nextResponse = NextResponse.json(payload, { status: response.status });
    clearSessionCookies(nextResponse);
    return nextResponse;
  }

  return NextResponse.json(payload, { status: response.status });
}
