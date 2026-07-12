// Client-safe root surface, exported by name so the package API is
// deliberate. Server-side helpers are NOT re-exported here — they live
// behind subpaths (`@repo/web-core/server`, `@repo/web-core/auth/cookies`)
// and are guarded by `server-only`. Large surfaces (api-types,
// search-params, components) stay on their subpaths.
export type * from "./api-types";
export { useDebouncedValue } from "./hooks/use-debounced-value";
export { useIsMobile } from "./hooks/use-is-mobile";
export { ApiClientError, getCsrfCookieName, webFetch } from "./http";
export type {
  JsonArray,
  JsonObject,
  JsonPrimitive,
  JsonValue,
} from "./json";
export { isJsonObject, isJsonValue, parseJsonValue } from "./json";
export type { CreateUseSessionOptions } from "./session";
export { createUseSession } from "./session";
export type { CookieOptions } from "./storage";
export { safeCookies, safeLocalStorage } from "./storage";
export { cn, getCsrfTokenFromDocument } from "./utils";
