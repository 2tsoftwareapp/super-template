export const VERIFY_EMAIL_ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";

export const VERIFY_EMAIL_REDIRECT_DELAY_MS = 3000;

export const VERIFY_EMAIL_MESSAGES = {
  success: "Email verified successfully! Your account is now active.",
  missingToken: "Missing verification token.",
  networkError: "Network error. Please try again.",
  fallbackError: "Verification failed.",
} as const;
