import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { resolveAdminProxy } from "@/lib/auth/proxy-auth";

// Next.js 16 proxy (formerly "middleware"): a server-side pre-filter that
// redirects obviously-anonymous requests to /login before any page JS ships.
// The authoritative session + RBAC check still runs client-side (useAdminGuard)
// against /auth/me — this only fast-paths the no-cookie case.
export function proxy(request: NextRequest) {
  const decision = resolveAdminProxy({
    pathname: request.nextUrl.pathname,
    hasRefreshToken: request.cookies.has(REFRESH_TOKEN_COOKIE),
  });

  if (decision.action === "redirect") {
    const url = request.nextUrl.clone();
    url.pathname = decision.to;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except Next internals, static assets, the API routes,
  // and the /login subtree (login page + SSO callback).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|login).*)",
  ],
};
