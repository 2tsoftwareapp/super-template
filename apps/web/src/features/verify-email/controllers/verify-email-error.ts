import { classifyError, getErrorMessage } from "@repo/web-utils/errors";

import { ApiClientError } from "@/core/http/errors";

import { VERIFY_EMAIL_MESSAGES } from "../config/verify-email-config";

export function getVerifyEmailErrorMessage(error: unknown): string {
  const classified = classifyError(error);

  if (classified.kind === "network") {
    return VERIFY_EMAIL_MESSAGES.networkError;
  }

  if (error instanceof ApiClientError) {
    return error.payload?.error.message ?? VERIFY_EMAIL_MESSAGES.fallbackError;
  }

  return getErrorMessage(error, VERIFY_EMAIL_MESSAGES.fallbackError);
}
