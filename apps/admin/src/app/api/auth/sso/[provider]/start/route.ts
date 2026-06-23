import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callBackend } from "@/lib/server/backend";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const redirectUri = request.nextUrl.searchParams.get("redirectUri") ?? "";
  const pathWithParams = `auth/sso/${provider}/start?redirectUri=${encodeURIComponent(redirectUri)}`;

  const response = await callBackend({
    path: pathWithParams,
    method: "GET",
    headers: new Headers({ accept: "application/json" }),
  });

  const payload = await response.json();
  return NextResponse.json(payload, { status: response.status });
}
