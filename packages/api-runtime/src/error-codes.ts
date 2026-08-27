/**
 * Generic transport/application error codes retained centrally. Every
 * domain-specific code lives in its owning feature's public error-codes.ts
 * (exported via that feature's contracts) — this file must not grow back into
 * a handwritten catalog of feature vocabularies.
 */
export const ERROR_CODES = {
  AUTH_FORBIDDEN: "AUTH_FORBIDDEN",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;
