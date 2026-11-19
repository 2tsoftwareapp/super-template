import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callApi } from "@/lib/backend";
import { clearSessionCookies, setSessionCookies } from "@/lib/cookies";

interface SessionPayload {
  data?: { accessToken: string; refreshToken: string; user: unknown };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.json({ data: { user: result.body.data.user } });
  setSessionCookies(response, result.body.data);

  return response;
}
