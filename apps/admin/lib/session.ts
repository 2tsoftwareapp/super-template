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

type RefreshOutcome =
  | { kind: "refreshed"; tokens: SessionTokens }
  | { kind: "lost-race"; payload: RefreshPayload }
  | { kind: "failed" };

async function refreshOnce(refreshToken: string): Promise<RefreshOutcome> {
  const refresh = await callApi<RefreshPayload | null>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  if (refresh.status === 200 && refresh.body?.data) {
    return { kind: "refreshed", tokens: refresh.body.data };
  }

  if (refresh.body?.error?.code === "AUTH_SESSION_ROTATED") {
    return { kind: "lost-race", payload: refresh.body };
  }

  return { kind: "failed" };
}

function toNextResponse(status: number, body: unknown): NextResponse {
  // 204 (and any empty body) must not be wrapped in a JSON body.
  return status === 204 || body === null
    ? new NextResponse(null, { status })
    : NextResponse.json(body, { status });
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

  const first = await callApi<unknown>(path, { ...init, ...(accessToken ? { accessToken } : {}) });

  if (first.status !== 401 || !refreshToken) {
    const response = toNextResponse(first.status, first.body);
    if (first.status === 401) clearSessionCookies(response);
    return response;
  }

  const outcome = await refreshOnce(refreshToken);

  // A parallel request won the refresh: tell the client to retry with the rotated
  // cookies (see adminFetch) and leave those cookies alone.
  if (outcome.kind === "lost-race") {
    return NextResponse.json(outcome.payload, { status: 401 });
  }

  if (outcome.kind === "failed") {
    const response = toNextResponse(first.status, first.body);
    clearSessionCookies(response);
    return response;
  }

  const retried = await callApi<unknown>(path, {
    ...init,
    accessToken: outcome.tokens.accessToken,
  });
  const response = toNextResponse(retried.status, retried.body);
  setSessionCookies(response, outcome.tokens);

  return response;
}
