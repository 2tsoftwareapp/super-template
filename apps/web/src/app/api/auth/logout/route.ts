import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { clearSessionCookies, readAuthCookies, setCsrfCookie } from "@/core/auth/cookies";
import { callBackend, enforceCsrf } from "@/core/server/backend";

export async function POST(request: NextRequest) {
  const csrfFailure = await enforceCsrf(request);
  if (csrfFailure) {
    return csrfFailure;
  }

  const { accessToken } = await readAuthCookies();

  if (accessToken) {
    await callBackend({
      path: "auth/logout",
      method: "POST",
      headers: new Headers(),
      accessToken,
    }).catch(() => undefined);
  }

  const nextResponse = NextResponse.json({
    data: { success: true },
    meta: { requestId: crypto.randomUUID() },
  });

  clearSessionCookies(nextResponse);
  setCsrfCookie(nextResponse);

  return nextResponse;
}
