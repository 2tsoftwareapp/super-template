import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { isSameOrigin } from "@/lib/is-same-origin";
import { proxyWithSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: { code: "AUTH_FORBIDDEN", message: "Bad origin" } },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  return proxyWithSession(request, `/users/${id}/status`, {
    method: "PATCH",
    body: await request.text(),
  });
}
