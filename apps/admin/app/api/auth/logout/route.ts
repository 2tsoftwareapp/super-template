import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callApi } from "@/lib/backend";
import { clearSessionCookies } from "@/lib/cookies";
import { isSameOrigin } from "@/lib/is-same-origin";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { code: "AUTH_FORBIDDEN", message: "Bad origin" } },
      { status: 403 },
    );
  }

  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (refreshToken) {
    await callApi("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
  }

  const response = new NextResponse(null, { status: 204 });
  clearSessionCookies(response);

  return response;
}
