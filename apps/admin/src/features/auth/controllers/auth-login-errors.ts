import { ApiClientError } from "@/lib/http";

import {
  AUTH_HTTP_STATUS,
  AUTH_MESSAGES,
  AUTH_NETWORK_ERROR_PATTERN,
} from "../model/auth.constants";
import { AuthFlowError } from "../model/auth.errors";

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
