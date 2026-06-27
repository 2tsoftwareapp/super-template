import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { clearAuthCookies, readAuthCookies } from "@/lib/auth/cookies";
import { callBackend, enforceCsrf } from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const csrfFailure = await enforceCsrf(request);
  if (csrfFailure) {
    return csrfFailure;
  }

  const { accessToken } = await readAuthCookies();

  if (accessToken) {
    // Best-effort: revoke the session server-side, but an already-invalid or
    // expired access token (auth/* calls deliberately skip the silent-refresh
    // retry in proxyWithRefresh) must not block the client from logging out.
    // Clearing cookies below is what actually ends the session for this client.
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
  clearAuthCookies(nextResponse);
  return nextResponse;
}
