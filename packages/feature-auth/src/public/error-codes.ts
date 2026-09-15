import { AUTH_ERROR_CODES as SHARED_AUTH_ERROR_CODES } from "@repo/api-kernel";

/**
 * Domain-owned error codes for @repo/feature-auth. Stable API contract values —
 * same codes, same values, same shape as before.
 *
 * `AUTH_INVALID_CREDENTIALS` is owned by the kernel-shared catalog
 * (`@repo/api-kernel`) because feature-user-management raises it for its own
 * wrong-current-password check without depending on this feature; the value is
 * re-exported here so this contract stays the single import site for callers.
 */
export const AUTH_ERROR_CODES = {
  ...SHARED_AUTH_ERROR_CODES,
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
  AUTH_SESSION_REVOKED: "AUTH_SESSION_REVOKED",
  AUTH_REFRESH_TOKEN_REUSED: "AUTH_REFRESH_TOKEN_REUSED",
} as const;
