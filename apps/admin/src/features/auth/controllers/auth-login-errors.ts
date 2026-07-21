import { classifyError } from "@repo/web-utils/errors";

import { ApiClientError } from "@/lib/http";

import {
  AUTH_HTTP_STATUS,
  AUTH_MESSAGES,
} from "../model/auth.constants";
import { AuthFlowError } from "../model/auth.errors";

/**
 * Map login failures to safe copy. Uses `classifyError` for kind/retryability
 * (§18.1) while preserving auth-specific messages for known statuses.
 */
export function getLoginErrorMessage(error: unknown) {
  if (error instanceof AuthFlowError) return error.message;

  const classified = classifyError(error);

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

  if (classified.kind === "network") {
    return AUTH_MESSAGES.apiUnavailable;
  }

  return AUTH_MESSAGES.signInFailed;
}

export function getMfaErrorMessage(error: unknown) {
  if (error instanceof AuthFlowError) return error.message;

  const classified = classifyError(error);
  if (
    classified.kind === "auth" ||
    (error instanceof ApiClientError &&
      error.status === AUTH_HTTP_STATUS.unauthorized)
  ) {
    return AUTH_MESSAGES.invalidMfaCode;
  }

  return AUTH_MESSAGES.invalidMfaCode;
}
