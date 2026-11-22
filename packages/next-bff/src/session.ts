import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callApi, fetchApi, type ApiInit } from "./backend";
import { clearSessionCookies, setSessionCookies } from "./cookies";

export interface SessionTokens {
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

export interface ProxyInit extends RequestInit {
  /** The API answers with a new session (change password): store it, hide the tokens. */
  adoptSession?: boolean;
}

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

function issuedSession(body: unknown): (SessionTokens & { user: unknown }) | null {
  const data = (body as { data?: Partial<SessionTokens> & { user?: unknown } } | null)?.data;

  return data?.accessToken && data.refreshToken
    ? { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user }
    : null;
}

function toNextResponse(status: number, body: unknown, adoptSession = false): NextResponse {
  const session = adoptSession ? issuedSession(body) : null;

  if (session) {
    const response = NextResponse.json({ data: { user: session.user } }, { status });
    setSessionCookies(response, session);
    return response;
  }

  // 204 (and any empty body) must not be wrapped in a JSON body.
  return status === 204 || body === null
    ? new NextResponse(null, { status })
    : NextResponse.json(body, { status });
}

/**
 * Calls `send` with the access-token cookie. On 401 it refreshes once and calls
 * it again; the caller writes the rotated cookies on the way out.
 */
async function withSession<T extends { status: number }>(
  request: NextRequest,
  send: (accessToken?: string) => Promise<T>,
): Promise<{ result: T; outcome?: RefreshOutcome }> {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const first = await send(accessToken);

  if (first.status !== 401 || !refreshToken) {
    return { result: first };
  }

  const outcome = await refreshOnce(refreshToken);

  if (outcome.kind !== "refreshed") {
    return { result: first, outcome };
  }

  return { result: await send(outcome.tokens.accessToken), outcome };
}

/** Applies the refresh outcome to a response: rotated cookies, or a cleared session. */
function settle(response: NextResponse, status: number, outcome?: RefreshOutcome): NextResponse {
  if (outcome?.kind === "refreshed" && !response.cookies.get("access_token")) {
    setSessionCookies(response, outcome.tokens);
  } else if (status === 401 && outcome?.kind !== "lost-race") {
    clearSessionCookies(response);
  }

  return response;
}

/**
 * Calls the API with the session cookie. On 401 it refreshes once, retries, and
 * writes the rotated cookies on the way out. One place, every BFF route.
 */
export async function proxyWithSession(
  request: NextRequest,
  path: string,
  init: ProxyInit = {},
): Promise<NextResponse> {
  const { adoptSession, ...requestInit } = init;
  const { result, outcome } = await withSession(request, (accessToken?: string) =>
    callApi<unknown>(path, { ...requestInit, ...(accessToken ? { accessToken } : {}) }),
  );

  // A parallel request won the refresh: tell the client to retry with the rotated
  // cookies (see sessionFetch) and leave those cookies alone.
  if (outcome?.kind === "lost-race") {
    return NextResponse.json(outcome.payload, { status: 401 });
  }

  return settle(toNextResponse(result.status, result.body, adoptSession), result.status, outcome);
}

const PASSTHROUGH_HEADERS = [
  "content-type",
  "content-disposition",
  "content-length",
  "x-content-type-options",
];

/** Streams a binary API response (file download) through the BFF with the session cookie. */
export async function downloadWithSession(
  request: NextRequest,
  path: string,
): Promise<NextResponse> {
  const { result, outcome } = await withSession(request, (accessToken?: string) =>
    fetchApi(path, accessToken ? { accessToken } : ({} satisfies ApiInit)),
  );
  const headers = new Headers();

  for (const name of PASSTHROUGH_HEADERS) {
    const value = result.headers.get(name);
    if (value) headers.set(name, value);
  }

  return settle(
    new NextResponse(result.body, { status: result.status, headers }),
    result.status,
    outcome,
  );
}
