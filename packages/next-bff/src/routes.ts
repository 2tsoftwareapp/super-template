import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callApi } from "./backend";
import { clearSessionCookies, setSessionCookies } from "./cookies";

interface SessionPayload {
  data?: { accessToken: string; refreshToken: string; user: unknown };
  error?: { code: string; message: string };
}

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null;
    }

    throw error;
  }
}

/**
 * Posts the JSON body to an API route that issues a session (login, register),
 * stores the tokens as httpOnly cookies and returns only the user.
 */
export async function startSession(request: NextRequest, path: string): Promise<NextResponse> {
  const body = await readJson(request);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: "Body must be JSON" } },
      { status: 400 },
    );
  }

  // The API rate-limits per client IP + email; without this every user shares the BFF's IP.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const result = await callApi<SessionPayload>(path, {
    method: "POST",
    body: JSON.stringify(body),
    ...(forwardedFor ? { headers: { "x-forwarded-for": forwardedFor } } : {}),
  });

  if (!result.body?.data) {
    return NextResponse.json(result.body, { status: result.status });
  }

  const response = NextResponse.json({ data: { user: result.body.data.user } });
  setSessionCookies(response, result.body.data);

  return response;
}

/** Forwards a public, cookie-less JSON call (forgot / reset password) as is. */
export async function forwardPublic(request: NextRequest, path: string): Promise<NextResponse> {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const result = await callApi<unknown>(path, {
    method: "POST",
    body: await request.text(),
    ...(forwardedFor ? { headers: { "x-forwarded-for": forwardedFor } } : {}),
  });

  return result.body === null
    ? new NextResponse(null, { status: result.status })
    : NextResponse.json(result.body, { status: result.status });
}

/** Revokes the refresh token at the API and clears both cookies. */
export async function endSession(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (refreshToken) {
    await callApi("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
  }

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);

  return response;
}
