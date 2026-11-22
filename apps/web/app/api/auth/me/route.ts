import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import { badOrigin, proxyWithSession } from "@lean/next-bff";

import { isSameOrigin } from "@/lib/is-same-origin";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return proxyWithSession(request, "/auth/me");
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return badOrigin();
  }

  return proxyWithSession(request, "/auth/me", { method: "PATCH", body: await request.text() });
}
