import { describe, expect, it, vi } from "vitest";
import { AppError } from "@repo/api-kernel";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";

import {
  assertActorHasOrganizationContext,
  assertUserBelongsToOrganization,
  resolveUsersListOrganizationId,
} from "../user-org-scope.policy";

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
    const makeMembership = (isMember: boolean) => ({
      findMembership: vi.fn().mockResolvedValue(isMember ? { role: "MEMBER" } : null),
      listForUser: vi.fn().mockResolvedValue([]),
      addMember: vi.fn().mockResolvedValue(null),
      upsertMember: vi.fn().mockResolvedValue(null),
      listMembers: vi.fn().mockResolvedValue([]),
      findUserIdsForOrganization: vi.fn().mockResolvedValue([]),
      countOwners: vi.fn().mockResolvedValue(1),
      countMembers: vi.fn().mockResolvedValue(1),
      updateMemberRole: vi.fn().mockResolvedValue(null),
      removeMember: vi.fn().mockResolvedValue(null),
      findPrimaryOrganizationId: vi.fn().mockResolvedValue(null),
      deleteByOrganizationId: vi.fn().mockResolvedValue(undefined),
    });

    it("allows SUPER_ADMIN regardless", async () => {
      const membership = makeMembership(false);
      await expect(
        assertUserBelongsToOrganization(membership as never, superAdmin, "u1"),
      ).resolves.toBeUndefined();
      expect(membership.findMembership).not.toHaveBeenCalled();
    });
    it("passes when user belongs to org", async () => {
      const membership = makeMembership(true);
      await expect(
        assertUserBelongsToOrganization(membership as never, orgAdmin, "u1"),
      ).resolves.toBeUndefined();
    });
    it("throws when user does not belong to org", async () => {
      const membership = makeMembership(false);
      await expect(
        assertUserBelongsToOrganization(membership as never, orgAdmin, "u1"),
      ).rejects.toThrow(AppError);
    });
  });
});
