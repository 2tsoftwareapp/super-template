import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { describe, expect, it } from "vitest";

import { assertDelegableCatalogPermissions } from "../role-permission-catalog.policy";

const permission = (
  overrides: Partial<{ name: string; isSystem: boolean; scope: string | null }> = {
    name: "users.read",
    isSystem: true,
    scope: "organization",
  },
) => ({ name: "users.read", isSystem: true, scope: "organization", ...overrides });

const actor = (overrides: { roles?: string[]; permissions?: string[] } = {}) => ({
  roles: overrides.roles ?? ["ADMIN"],
  permissions: overrides.permissions ?? ["users.read"],
});

describe("assertDelegableCatalogPermissions", () => {
  it("allows a system permission the actor holds for an organization role", () => {
    expect(() =>
      assertDelegableCatalogPermissions({
        actor: actor(),
        targetOrganizationId: "org-1",
        permissions: [permission()],
      }),
    ).not.toThrow();
  });

  it("rejects non-system catalog entries", () => {
    expect(() =>
      assertDelegableCatalogPermissions({
        actor: actor(),
        targetOrganizationId: "org-1",
        permissions: [permission({ isSystem: false })],
      }),
    ).toThrowError(
      expect.objectContaining({
        code: ERROR_CODES.VALIDATION_FAILED,
        statusCode: 400,
      }),
    );
  });

  it("rejects platform-scoped permissions for an organization role", () => {
    let thrown: unknown;

    try {
      assertDelegableCatalogPermissions({
        actor: actor({ roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN], permissions: [] }),
        targetOrganizationId: "org-1",
        permissions: [permission({ scope: "platform" })],
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN, statusCode: 403 });
  });

  it("allows platform-scoped permissions for a platform role", () => {
    expect(() =>
      assertDelegableCatalogPermissions({
        actor: actor({ roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN], permissions: [] }),
        targetOrganizationId: null,
        permissions: [permission({ scope: "platform" })],
      }),
    ).not.toThrow();
  });

  it("rejects delegation of a permission the actor does not hold", () => {
    expect(() =>
      assertDelegableCatalogPermissions({
        actor: actor({ permissions: ["roles.create"] }),
        targetOrganizationId: "org-1",
        permissions: [permission()],
      }),
    ).toThrowError(expect.objectContaining({ code: ERROR_CODES.AUTH_FORBIDDEN, statusCode: 403 }));
  });

  it("lets SUPER_ADMIN delegate permissions it does not hold", () => {
    expect(() =>
      assertDelegableCatalogPermissions({
        actor: actor({ roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN], permissions: [] }),
        targetOrganizationId: "org-1",
        permissions: [permission()],
      }),
    ).not.toThrow();
  });
});
