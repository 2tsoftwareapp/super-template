import { describe, expect, it, vi } from "vitest";
import { AppError, ROLE_NAMES } from "@repo/api-runtime";

import {
  assertActorHasOrganizationContext,
  assertUserBelongsToOrganization,
  resolveUsersListOrganizationId,
} from "./user-org-scope.policy";

const superAdmin = {
  userId: "super",
  sessionId: "s1",
  email: "super@test.com",
  displayName: "Super",
  status: "ACTIVE" as const,
  roles: [ROLE_NAMES.SUPER_ADMIN],
  permissions: [] as string[],
  organizationId: "org-1",
};

const orgAdmin = { ...superAdmin, userId: "admin", roles: [ROLE_NAMES.ADMIN] };
const orgUserNoOrg = { ...orgAdmin, organizationId: null as string | null };

describe("user-org-scope.policy", () => {
  describe("resolveUsersListOrganizationId", () => {
    it("returns undefined for SUPER_ADMIN", () => {
      expect(resolveUsersListOrganizationId(superAdmin)).toBeUndefined();
    });
    it("returns organizationId for org user", () => {
      expect(resolveUsersListOrganizationId(orgAdmin)).toBe("org-1");
    });
    it("throws when org user has no organizationId", () => {
      expect(() => resolveUsersListOrganizationId(orgUserNoOrg as any)).toThrow(AppError);
    });
  });

  describe("assertActorHasOrganizationContext", () => {
    it("throws for SUPER_ADMIN", () => {
      expect(() => assertActorHasOrganizationContext(superAdmin)).toThrow(AppError);
    });
    it("returns organizationId for org user", () => {
      expect(assertActorHasOrganizationContext(orgAdmin)).toBe("org-1");
    });
    it("throws when org user has no org", () => {
      expect(() => assertActorHasOrganizationContext(orgUserNoOrg as any)).toThrow(AppError);
    });
  });

  describe("assertUserBelongsToOrganization", () => {
    it("allows SUPER_ADMIN regardless", async () => {
      const isMember = vi.fn();
      await expect(
        assertUserBelongsToOrganization(isMember, superAdmin, "u1"),
      ).resolves.toBeUndefined();
      expect(isMember).not.toHaveBeenCalled();
    });
    it("passes when user belongs to org", async () => {
      const isMember = vi.fn().mockResolvedValue(true);
      await expect(
        assertUserBelongsToOrganization(isMember, orgAdmin, "u1"),
      ).resolves.toBeUndefined();
    });
    it("throws when user does not belong to org", async () => {
      const isMember = vi.fn().mockResolvedValue(false);
      await expect(assertUserBelongsToOrganization(isMember, orgAdmin, "u1")).rejects.toThrow(
        AppError,
      );
    });
  });
});
