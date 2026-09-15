/** Domain-owned error codes for @repo/feature-users. Stable API contract values. */
export const USER_ERROR_CODES = {
  USER_EMAIL_ALREADY_EXISTS: "USER_EMAIL_ALREADY_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  /** Org-scoped user lookups ran without the USER_ORGANIZATION_SCOPE port bound. */
  USER_ORGANIZATION_SCOPE_UNAVAILABLE: "USER_ORGANIZATION_SCOPE_UNAVAILABLE",
} as const;
