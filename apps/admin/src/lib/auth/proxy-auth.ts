// Pure decision logic for the admin auth proxy (Next.js 16's renamed
// "middleware"). Kept free of next/server so it can be unit-tested without the
// edge runtime. The route matcher in proxy.ts is the primary filter; this
// helper re-checks public prefixes so its behavior is fully self-contained.

/** Paths that must render before a session cookie exists (login + SSO callback). */
const PUBLIC_PREFIXES = ["/login"];

export type ProxyDecision =
  | { action: "next" }
  | { action: "redirect"; to: string };

export function resolveAdminProxy(input: {
  pathname: string;
  hasRefreshToken: boolean;
}): ProxyDecision {
  const isPublic = PUBLIC_PREFIXES.some(
    (prefix) =>
      input.pathname === prefix || input.pathname.startsWith(`${prefix}/`),
  );

  if (isPublic) {
    return { action: "next" };
  }

  if (!input.hasRefreshToken) {
    return { action: "redirect", to: "/login" };
  }

  return { action: "next" };
}
