// Pure decision logic for the admin auth proxy (Next.js 16's renamed
// "middleware"). Kept free of next/server so it can be unit-tested without the
// edge runtime. Locale-aware: pathnames arrive with an optional /en|/vi prefix
// (next-intl "always" localePrefix); auth rules apply to the unprefixed path
// and redirects preserve the request's locale.

import { routing } from "@/i18n/routing";

/** Paths that must render before a session cookie exists (login + SSO callback). */
const PUBLIC_PREFIXES = ["/login"];

export type ProxyDecision =
  | { action: "next" }
  | { action: "redirect"; to: string };

/** Split "/vi/users" → { locale: "vi", pathname: "/users" }. */
export function splitLocale(pathname: string): {
  locale: string;
  pathname: string;
} {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) {
      return { locale, pathname: "/" };
    }
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, pathname: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: routing.defaultLocale, pathname };
}

export function resolveAdminProxy(input: {
  pathname: string;
  hasRefreshToken: boolean;
}): ProxyDecision {
  const { locale, pathname } = splitLocale(input.pathname);

  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isPublic) {
    return { action: "next" };
  }

  if (!input.hasRefreshToken) {
    return { action: "redirect", to: `/${locale}/login` };
  }

  return { action: "next" };
}
