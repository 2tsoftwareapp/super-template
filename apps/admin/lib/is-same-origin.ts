import type { NextRequest } from "next/server";

/**
 * CSRF guard for cookie-authenticated mutations: a browser always sends Origin
 * on a cross-site POST, so a missing or foreign Origin is rejected.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const allowed = process.env.ADMIN_ORIGIN ?? "http://localhost:3002";

  return origin === allowed;
}
