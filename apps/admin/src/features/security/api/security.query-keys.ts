/** Hierarchical query keys for account-security data. */
export const securityKeys = {
  all: ["security"] as const,
  mfa: () => [...securityKeys.all, "mfa"] as const,
  mfaStatus: () => [...securityKeys.mfa(), "status"] as const,
};
