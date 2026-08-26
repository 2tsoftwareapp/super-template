import { describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "@repo/api-runtime";

import { resolveAssignableRole } from "../assignable-role.resolver";

function mockService(overrides: Record<string, unknown> = {}) {
  return {
    getRoleByName: vi.fn(),
    getOrganizationRoleByName: vi.fn(),
    ...overrides,
  } as any;
}

describe("resolveAssignableRole", () => {
  describe("USER role", () => {
    it("resolves platform-level USER role", async () => {
      const svc = mockService({
        getRoleByName: vi.fn(async () => ({
          id: "role-user",
          name: "USER",
          organizationId: null,
          isSystem: true,
        })),
      });

      const result = await resolveAssignableRole(svc, "USER", null);

      expect(result).toEqual({
        id: "role-user",
        target: { name: "USER", organizationId: null, isSystem: true },
      });
      expect(svc.getRoleByName).toHaveBeenCalledWith("USER", null, undefined);
    });

    it("throws when USER role is missing", async () => {
      const svc = mockService({
        getRoleByName: vi.fn(async () => null),
      });

      await expect(resolveAssignableRole(svc, "USER", null)).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
      });
    });
  });

  describe("ADMIN role", () => {
    it("resolves org-scoped ADMIN role", async () => {
      const svc = mockService({
        getOrganizationRoleByName: vi.fn(async () => ({
          id: "role-admin",
          name: "ADMIN",
          organizationId: "org-1",
          isSystem: true,
        })),
      });

      const result = await resolveAssignableRole(svc, "ADMIN", "org-1");

      expect(result).toEqual({
        id: "role-admin",
        target: { name: "ADMIN", organizationId: "org-1", isSystem: true },
      });
      expect(svc.getOrganizationRoleByName).toHaveBeenCalledWith("ADMIN", "org-1", undefined);
    });

    it("throws when organizationId is missing", async () => {
      const svc = mockService();

      await expect(resolveAssignableRole(svc, "ADMIN", null)).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    });
  });

  describe("custom role", () => {
    it("resolves custom org-scoped role", async () => {
      const svc = mockService({
        getRoleByName: vi.fn(async () => ({
          id: "role-custom",
          name: "ACCOUNTANT",
          organizationId: "org-1",
          isSystem: false,
        })),
      });

      const result = await resolveAssignableRole(svc, "ACCOUNTANT", "org-1");

      expect(result).toEqual({
        id: "role-custom",
        target: { name: "ACCOUNTANT", organizationId: "org-1", isSystem: false },
      });
      expect(svc.getRoleByName).toHaveBeenCalledWith("ACCOUNTANT", "org-1", undefined);
    });

    it("throws when organizationId is missing for custom role", async () => {
      const svc = mockService();

      await expect(resolveAssignableRole(svc, "ACCOUNTANT", null)).rejects.toMatchObject({
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    });

    it("throws when custom role not found", async () => {
      const svc = mockService({
        getRoleByName: vi.fn(async () => null),
      });

      await expect(resolveAssignableRole(svc, "MISSING_ROLE", "org-1")).rejects.toMatchObject({
        code: ERROR_CODES.INTERNAL_ERROR,
      });
    });
  });
});
