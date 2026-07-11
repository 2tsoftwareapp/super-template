import createIntlMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

// Next.js 16 proxy (formerly "middleware"): locale negotiation only — the web
// app has no authenticated routes. Query strings (e.g. verify-email tokens)
// are preserved through the locale redirect.
export const proxy = createIntlMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
