/**
 * Shared error-code catalog for domain rules that one feature raises on behalf
 * of another feature's data. Living at kernel level lets the raising feature
 * (e.g. auth) avoid a package dependency on the owning feature (e.g. settings)
 * for a constant; the owning feature re-exports the same object so its public
 * contract stays stable.
 */
export const SETTINGS_ERROR_CODES = {
  SETTINGS_NOT_FOUND: "SETTINGS_NOT_FOUND",
  REGISTRATION_DISABLED: "REGISTRATION_DISABLED",
  // Raised when a settings value does not match the per-key definition in the
  // settings registry (SETTING_DEFINITIONS); the value is rejected before write.
  SETTINGS_INVALID_VALUE: "SETTINGS_INVALID_VALUE",
} as const;

/**
 * Auth codes a second feature raises for its own auth-domain check:
 * feature-user-management answers "wrong current password" on
 * `PATCH /users/me/password` with `AUTH_INVALID_CREDENTIALS`, and must not
 * depend on `@repo/feature-auth` for the constant. Only codes with more than
 * one raiser live here — the rest of the auth catalog stays feature-owned, and
 * `@repo/feature-auth` re-exports this value through its `public/error-codes.ts`
 * so its contract keeps the same codes and values.
 */
export const AUTH_ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
} as const;
