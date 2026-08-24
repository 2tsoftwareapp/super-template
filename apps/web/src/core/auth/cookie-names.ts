// Client-safe cookie name constants. Kept in their own module so client bundles
// can import a name without pulling in the server-only cookie helpers.
export const ACCESS_TOKEN_COOKIE = "st_web_access_token";
export const REFRESH_TOKEN_COOKIE = "st_web_refresh_token";
export const CSRF_TOKEN_COOKIE = "st_web_csrf";
