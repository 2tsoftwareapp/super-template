import { ApiClientError } from "@/lib/http";

import {
  AUTH_FLOW_ERROR_CODES,
  AUTH_HTTP_STATUS,
  AUTH_MESSAGES,
  AUTH_NETWORK_ERROR_PATTERN,
  type AuthFlowErrorCode,
} from "./auth-constants";

const authFlowMessages: Record<AuthFlowErrorCode, string> = {
  [AUTH_FLOW_ERROR_CODES.mfaRequired]: AUTH_MESSAGES.mfaRequired,
  [AUTH_FLOW_ERROR_CODES.missingMfaToken]: AUTH_MESSAGES.missingMfaToken,
  [AUTH_FLOW_ERROR_CODES.notAdmin]: AUTH_MESSAGES.adminOnly,
  [AUTH_FLOW_ERROR_CODES.ssoStartFailed]: AUTH_MESSAGES.ssoStartFailed,
};

export class AuthFlowError extends Error {
  constructor(
    public readonly code: AuthFlowErrorCode,
    public readonly metadata: { mfaToken?: string } = {},
  ) {
    super(authFlowMessages[code]);
    this.name = "AuthFlowError";
  }
}

export function getLoginErrorMessage(error: unknown) {
  if (error instanceof AuthFlowError) return error.message;

  if (error instanceof ApiClientError) {
    if (error.status === AUTH_HTTP_STATUS.unauthorized) {
      return AUTH_MESSAGES.invalidCredentials;
    }
    if (error.status === AUTH_HTTP_STATUS.forbidden) {
      if (error.payload?.error.message === "CSRF validation failed") {
        return AUTH_MESSAGES.csrfFailed;
      }

      return AUTH_MESSAGES.userInactive;
    }

    return error.payload?.error.message ?? AUTH_MESSAGES.signInFailed;
  }

  if (
    error instanceof TypeError &&
    AUTH_NETWORK_ERROR_PATTERN.test(error.message)
  ) {
    return AUTH_MESSAGES.apiUnavailable;
  }

  return AUTH_MESSAGES.signInFailed;
}

export function getMfaErrorMessage(error: unknown) {
  if (error instanceof AuthFlowError) return error.message;
  if (
    error instanceof ApiClientError &&
    error.status === AUTH_HTTP_STATUS.unauthorized
  ) {
    return AUTH_MESSAGES.invalidMfaCode;
  }

  return AUTH_MESSAGES.invalidMfaCode;
}
