import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { callApi } from "@lean/next-bff";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "AUTH_UNAUTHORIZED", message: "No session" } },
      { status: 401 },
    );
  }

  const result = await callApi("/auth/me", { accessToken });

  return NextResponse.json(result.body, { status: result.status });
}
