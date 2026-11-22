import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callApi } from "./backend";
import { clearSessionCookies, setSessionCookies } from "./cookies";

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

interface RefreshPayload {
  data?: SessionTokens;
  error?: { code: string; message: string };
}

/**
 * Calls the API with the session cookie. On 401 it refreshes once, retries, and
 * writes the rotated cookies on the way out. One place, every BFF route.
 */
export async function proxyWithSession(
  request: NextRequest,
  path: string,
  init: RequestInit = {},
): Promise<NextResponse> {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let result = await callApi<unknown>(path, { ...init, ...(accessToken ? { accessToken } : {}) });
  let refreshed: SessionTokens | null = null;
  let lostRace: RefreshPayload | null = null;

  if (result.status === 401 && refreshToken) {
    const refresh = await callApi<RefreshPayload | null>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });

    if (refresh.status === 200 && refresh.body?.data) {
      refreshed = refresh.body.data;
      result = await callApi<unknown>(path, { ...init, accessToken: refreshed.accessToken });
    } else if (refresh.body?.error?.code === "AUTH_SESSION_ROTATED") {
      lostRace = refresh.body;
    }
  }

  // A parallel request won the refresh: tell the client to retry with the rotated
  // cookies (see adminFetch) and leave those cookies alone.
  if (lostRace) {
    return NextResponse.json(lostRace, { status: 401 });
  }

  // 204 (and any empty body) must not be wrapped in a JSON body.
  const response =
    result.status === 204 || result.body === null
      ? new NextResponse(null, { status: result.status })
      : NextResponse.json(result.body, { status: result.status });

  if (refreshed) {
    setSessionCookies(response, refreshed);
  } else if (result.status === 401) {
    clearSessionCookies(response);
  }

  return response;
}
