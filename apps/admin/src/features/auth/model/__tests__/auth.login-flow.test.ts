import { describe, expect, it } from "vitest";

import type { AuthLoginResponse } from "@/lib/api-types";

import { AUTH_FLOW_ERROR_CODES, AUTH_FLOW_RESULTS } from "../auth.constants";
import { AuthFlowError } from "../auth.errors";
import { assertAdminLoginAccess, resolveAdminLoginResult } from "../auth.login-flow";

function loginResponse(overrides: Record<string, unknown> = {}): AuthLoginResponse {
  return {
    data: {
      mfaRequired: false,
      mustChangePassword: false,
      permissions: ["users.read"],
      user: {
        id: "u1",
        displayName: "Admin",
        email: "admin@example.local",
        roles: ["ADMIN"],
        status: "ACTIVE",
        emailVerifiedAt: null,
        roleIds: [],
        roleAssignments: [],
        memberOrganizationIds: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      ...overrides,
    },
    meta: { requestId: "test" },
  } as unknown as AuthLoginResponse;
}

describe("resolveAdminLoginResult", () => {
  it("returns mfaRequired when the payload asks for a challenge", () => {
    expect(
      resolveAdminLoginResult(loginResponse({ mfaRequired: true, mfaToken: "mfa-token" })),
    ).toEqual({
      status: AUTH_FLOW_RESULTS.mfaRequired,
      mfaToken: "mfa-token",
    });
  });

  it("fails closed when MFA is required without a token", () => {
    expect(() => resolveAdminLoginResult(loginResponse({ mfaRequired: true }))).toThrow(
      AuthFlowError,
    );
  });

  it("rejects principals without admin access", () => {
    try {
      resolveAdminLoginResult(
        loginResponse({
          permissions: [],
          user: {
            id: "u2",
            displayName: "User",
            email: "user@example.local",
            roles: ["USER"],
            status: "ACTIVE",
            emailVerifiedAt: null,
            roleIds: [],
            roleAssignments: [],
            memberOrganizationIds: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        }),
      );
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AuthFlowError);
      expect((error as AuthFlowError).code).toBe(AUTH_FLOW_ERROR_CODES.notAdmin);
    }
  });

  it("routes must-change-password before the authenticated state", () => {
    const response = loginResponse({ mustChangePassword: true });
    expect(resolveAdminLoginResult(response)).toEqual({
      status: AUTH_FLOW_RESULTS.mustChangePassword,
      response,
    });
  });
});

describe("assertAdminLoginAccess", () => {
  it("accepts an admin payload", () => {
    expect(() => assertAdminLoginAccess(loginResponse())).not.toThrow();
  });

  it("rejects a non-admin payload", () => {
    expect(() =>
      assertAdminLoginAccess(
        loginResponse({
          permissions: [],
          user: {
            id: "u2",
            displayName: "User",
            email: "user@example.local",
            roles: ["USER"],
            status: "ACTIVE",
            emailVerifiedAt: null,
            roleIds: [],
            roleAssignments: [],
            memberOrganizationIds: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        }),
      ),
    ).toThrow(AuthFlowError);
  });
});
