import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
import { describe, expect, it } from "vitest";

/**
 * Wire-contract guard. `AUTH_INVALID_CREDENTIALS` moved to the kernel-shared
 * catalog and is merged back into this object, so the catalog must keep all
 * four codes with the exact values clients branch on.
 */
describe("AUTH_ERROR_CODES", () => {
  it("exposes every auth code with its wire value", () => {
    expect(AUTH_ERROR_CODES).toEqual({
      AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
      AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
      AUTH_SESSION_REVOKED: "AUTH_SESSION_REVOKED",
      AUTH_REFRESH_TOKEN_REUSED: "AUTH_REFRESH_TOKEN_REUSED",
    });
  });

  it("keeps the kernel-shared value for the cross-feature code", () => {
    expect(AUTH_ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe("AUTH_INVALID_CREDENTIALS");
  });
});
