import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/is-same-origin";
import { proxyWithSession } from "@lean/next-bff";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyWithSession(request, `/users${request.nextUrl.search}`);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { code: "AUTH_FORBIDDEN", message: "Bad origin" } },
      { status: 403 },
    );
  }

  return proxyWithSession(request, "/users", { method: "POST", body: await request.text() });
}
