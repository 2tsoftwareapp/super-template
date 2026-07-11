import type { NextRequest } from "next/server";

import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookie-names";
import { resolveAdminProxy } from "@/lib/auth/proxy-auth";

const intlMiddleware = createIntlMiddleware(routing);

// Next.js 16 proxy (formerly "middleware"), composing two pre-filters:
// 1. Auth: redirect obviously-anonymous requests to the locale's /login before
//    any page JS ships. The authoritative session + RBAC check still runs
//    client-side (useAdminGuard) against /auth/me.
// 2. Locale: next-intl negotiation — prefix-less requests get redirected to
//    /en/... or /vi/... and the locale cookie is maintained.
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

  return intlMiddleware(request);
}

export const config = {
  // Run on everything except Next internals, static assets, and API routes.
  // /login must go through for locale negotiation — auth exemption for it is
  // handled inside resolveAdminProxy, not the matcher.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
