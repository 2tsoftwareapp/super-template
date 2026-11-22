import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callApi } from "@lean/next-bff";
import { clearSessionCookies, setSessionCookies } from "@lean/next-bff";
import { isSameOrigin } from "@/lib/is-same-origin";

interface SessionPayload {
  data?: { accessToken: string; refreshToken: string; user: unknown };
  error?: { code: string; message: string };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { code: "AUTH_FORBIDDEN", message: "Bad origin" } },
      { status: 403 },
    );
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: "AUTH_UNAUTHORIZED", message: "No session" } },
      { status: 401 },
    );
  }

  const result = await callApi<SessionPayload>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  if (result.status !== 200 || !result.body.data) {
    const response = NextResponse.json(result.body, { status: result.status });

    // A concurrent refresh already rotated the cookie; clearing it would log the user out.
    if (result.body?.error?.code !== "AUTH_SESSION_ROTATED") {
      clearSessionCookies(response);
    }

    return response;
  }

  const response = NextResponse.json({ data: { user: result.body.data.user } });
  setSessionCookies(response, result.body.data);

  return response;
}
