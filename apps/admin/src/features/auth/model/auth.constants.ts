import type { SsoProvider } from "@/lib/api-paths";

export const ADMIN_AUTH_ROUTES = {
  login: "/login",
  postLogin: "/",
  ssoCallback: "/login/sso/callback",
} as const;

/** Empty defaults — seed credentials stay in UI copy, not prefilled secrets. */
export const ADMIN_LOGIN_DEFAULT_VALUES = {
  email: "",
  password: "",
} as const;

export const AUTH_ERROR_QUERY_VALUES = {
  ssoFailed: "sso_failed",
} as const;

export const AUTH_FLOW_ERROR_CODES = {
  mfaRequired: "mfa-required",
  missingMfaToken: "missing-mfa-token",
  notAdmin: "not-admin",
  ssoStartFailed: "sso-start-failed",
} as const;

export type AuthFlowErrorCode = (typeof AUTH_FLOW_ERROR_CODES)[keyof typeof AUTH_FLOW_ERROR_CODES];

export const AUTH_FLOW_RESULTS = {
  authenticated: "authenticated",
  mfaRequired: "mfa-required",
  mustChangePassword: "must-change-password",
} as const;

export type AuthFlowResult = (typeof AUTH_FLOW_RESULTS)[keyof typeof AUTH_FLOW_RESULTS];

export const AUTH_FORM_FIELD_NAMES = {
  code: "code",
  email: "email",
  password: "password",
} as const;

export const AUTH_HTTP_STATUS = {
  forbidden: 403,
  unauthorized: 401,
} as const;

export const AUTH_MESSAGES = {
  adminOnly: "Access denied. This portal is for administrators only.",
  apiUnavailable: "Cannot reach the API. Make sure the server is running.",
  checkingSession: "Checking your session...",
  completingSignIn: "Completing sign in...",
  invalidCredentials: "Invalid email or password.",
  invalidMfaCode: "Invalid verification code. Please try again.",
  mfaRequired: "This account requires two-factor verification. Enter your code below.",
  missingMfaToken: "Start sign-in again before entering a verification code.",
  ssoFailed: "SSO sign-in failed. Please try again or use email/password.",
  ssoStartFailed: "Could not start SSO. Please try again.",
  signInFailed: "Sign in failed. Please try again.",
  csrfFailed: "Your session expired. Refresh the page and try again.",
  userInactive: "Your account is not active or has not been verified.",
} as const;

export const AUTH_NETWORK_ERROR_PATTERN = /failed to fetch|fetch failed/i;

export const AUTH_SEARCH_PARAMS = {
  error: "error",
  exchange: "exchange",
} as const;

export const HTTP_METHODS = {
  post: "POST",
} as const;

export const LOGIN_CONTENT = {
  login: {
    description:
      "This app is split away from the client web. It owns management workflows, review queues, and system controls.",
    eyebrow: "Separate project",
    title: "Sign in to the admin app",
  },
  mfa: {
    description: "Open your authenticator app and enter the 6-digit code to complete sign-in.",
    eyebrow: "Two-factor verification",
    title: "Enter your verification code",
  },
} as const;

export const LOGIN_FORM_COPY = {
  adminLoginTitle: "Admin login",
  adminWorkspace: "Admin workspace",
  authCodeLabel: "Authentication code",
  backToLogin: "Back to login",
  continueWith: "or continue with",
  emailLabel: "Email",
  mfaCodePlaceholder: "000000",
  passwordLabel: "Password",
  seededAccountDescription: "Use the seeded admin account.",
  signIn: "Sign in",
  signingIn: "Signing in...",
  verify: "Verify",
  verifyIdentityTitle: "Verify your identity",
  verifying: "Verifying...",
  verificationDescription: "Enter the 6-digit code from your authenticator app.",
} as const;

export const SSO_PROVIDER_OPTIONS = [
  { label: "Continue with Google", provider: "google" },
  { label: "Continue with Apple", provider: "apple" },
] satisfies { label: string; provider: SsoProvider }[];
