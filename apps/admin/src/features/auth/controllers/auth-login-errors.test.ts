import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/lib/http";

import {
  AUTH_FLOW_ERROR_CODES,
  AUTH_HTTP_STATUS,
  AUTH_MESSAGES,
} from "../model/auth.constants";
import { AuthFlowError } from "../model/auth.errors";
import { getLoginErrorMessage } from "./auth-login-errors";

describe("auth error mapping", () => {
  it("maps domain auth errors without leaking control flow codes to the UI", () => {
    expect(
      getLoginErrorMessage(new AuthFlowError(AUTH_FLOW_ERROR_CODES.notAdmin)),
    ).toBe(AUTH_MESSAGES.adminOnly);
  });

  it("maps API status codes to user-facing login messages", () => {
    expect(
      getLoginErrorMessage(
        new ApiClientError(AUTH_HTTP_STATUS.unauthorized, null),
      ),
    ).toBe(AUTH_MESSAGES.invalidCredentials);

    expect(
      getLoginErrorMessage(
        new ApiClientError(AUTH_HTTP_STATUS.forbidden, null),
      ),
    ).toBe(AUTH_MESSAGES.userInactive);

    expect(
      getLoginErrorMessage(
        new ApiClientError(AUTH_HTTP_STATUS.forbidden, {
          error: {
            code: "AUTH_FORBIDDEN",
            message: "CSRF validation failed",
            details: null,
          },
          meta: { requestId: "req-1" },
        }),
      ),
    ).toBe(AUTH_MESSAGES.csrfFailed);
  });

  it("maps network failures to an actionable message", () => {
    expect(getLoginErrorMessage(new TypeError("Failed to fetch"))).toBe(
      AUTH_MESSAGES.apiUnavailable,
    );
  });
});
