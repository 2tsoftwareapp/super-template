import { ApiClientError } from "@repo/web-utils/http";
import { describe, expect, it } from "vitest";

import { VERIFY_EMAIL_MESSAGES } from "../../config/verify-email-config";
import { getVerifyEmailErrorMessage } from "../verify-email-error";

describe("getVerifyEmailErrorMessage", () => {
  it("uses the API error payload when available", () => {
    const error = new ApiClientError(400, {
      error: {
        code: "VERIFY_EMAIL_INVALID",
        message: "Verification token is invalid or expired.",
        details: null,
      },
      meta: { requestId: "req-1" },
    });

    expect(getVerifyEmailErrorMessage(error)).toBe("Verification token is invalid or expired.");
  });

  it("falls back safely when the API payload is missing", () => {
    const error = new ApiClientError(500, null);

    expect(getVerifyEmailErrorMessage(error)).toBe(VERIFY_EMAIL_MESSAGES.fallbackError);
  });

  it("does not expose an arbitrary error message", () => {
    expect(getVerifyEmailErrorMessage(new Error("internal stack detail"))).toBe(
      VERIFY_EMAIL_MESSAGES.fallbackError,
    );
  });
});
