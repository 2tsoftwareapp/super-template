import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

import { badOrigin, proxyWithSession } from "@lean/next-bff";

import { isSameOrigin } from "@/lib/is-same-origin";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return badOrigin();
  }

  return proxyWithSession(request, "/auth/change-password", {
    method: "POST",
    body: await request.text(),
    adoptSession: true,
  });
}
