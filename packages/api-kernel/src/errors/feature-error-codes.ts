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
} as const;
