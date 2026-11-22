import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

/** Signed-out visitors of /account go to /login; the API still checks every request. */
export function proxy(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has("access_token") || request.cookies.has("refresh_token");

  return hasSession ? NextResponse.next() : NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/account"],
};
