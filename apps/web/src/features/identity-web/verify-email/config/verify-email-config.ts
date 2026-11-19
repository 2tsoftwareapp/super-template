/**
 * Unset in a production build → null, so the success screen stays put instead
 * of redirecting the visitor to a developer machine address.
 */
export const VERIFY_EMAIL_ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ??
  (process.env.NODE_ENV === "production" ? null : "http://localhost:3002");

export const VERIFY_EMAIL_REDIRECT_DELAY_MS = 3000;

export const VERIFY_EMAIL_MESSAGES = {
  success: "Email verified successfully! Your account is now active.",
  missingToken: "Missing verification token.",
  networkError: "Network error. Please try again.",
  fallbackError: "Verification failed.",
} as const;
