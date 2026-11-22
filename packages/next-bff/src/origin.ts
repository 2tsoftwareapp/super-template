import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

/**
 * CSRF guard for cookie-authenticated mutations: a browser always sends Origin
 * on a cross-site POST, so a missing or foreign Origin is rejected.
 */
export function isSameOrigin(request: NextRequest, allowedOrigin: string): boolean {
  return request.headers.get("origin") === allowedOrigin;
}

export function badOrigin(): NextResponse {
  return NextResponse.json(
    { error: { code: "AUTH_FORBIDDEN", message: "Bad origin" } },
    { status: 403 },
  );
}
