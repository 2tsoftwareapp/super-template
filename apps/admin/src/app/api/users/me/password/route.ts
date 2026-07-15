import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { clearSessionCookies, setCsrfCookie } from "@/lib/auth/cookies";
import { callBackend, enforceMutationGuard } from "@/lib/server/backend";

export async function PATCH(request: NextRequest) {
  const guardFailure = await enforceMutationGuard(request);
  if (guardFailure) {
    return guardFailure;
  }

  const body = await request.text();
  const response = await callBackend({
    path: "users/me/password",
    method: "PATCH",
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

  return NextResponse.json(payload, { status: response.status });
}
