// Client-safe cookie name constants. Kept in their own module so client bundles
// (e.g. lib/http.ts) can import a name without pulling in the server-only cookie
// helpers in ./cookies.ts (which use next/headers and node:crypto).
export const ACCESS_TOKEN_COOKIE = "st_admin_access_token";
export const REFRESH_TOKEN_COOKIE = "st_admin_refresh_token";
export const CSRF_TOKEN_COOKIE = "st_admin_csrf";
