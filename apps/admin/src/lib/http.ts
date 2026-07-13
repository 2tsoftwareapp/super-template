import { configureHttpClient } from "@repo/web-utils/http-config";

import { CSRF_TOKEN_COOKIE } from "@/lib/auth/cookie-names";

configureHttpClient({ csrfCookieName: CSRF_TOKEN_COOKIE });

export { ApiClientError, webFetch } from "@repo/web-utils/http";

export function buildPath(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}
