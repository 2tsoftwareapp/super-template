import { describe, expect, it } from "vitest";

import {
  canDeleteOrganization,
  canLeaveOrganization,
  canRenameOrganization,
  selectOrganizationActorContext,
} from "../organizations.permissions";

const base = { email: "", displayName: "", createdAt: "", updatedAt: "" };
const members = [
  { ...base, userId: "owner-1", role: "OWNER" as const },
  { ...base, userId: "admin-1", role: "ADMIN" as const },
  { ...base, userId: "member-1", role: "MEMBER" as const },
];

describe("organizations.permissions", () => {
  it("derives actor context from members directory", () => {
    const ctx = selectOrganizationActorContext("admin-1", ["USER"], members);
    expect(ctx.isSuperAdmin).toBe(false);
    expect(ctx.isAdmin).toBe(true);
    expect(ctx.isOwner).toBe(false);
    expect(ctx.isMember).toBe(false);
  });

  it("detects super admin from roles", () => {
    const ctx = selectOrganizationActorContext("x", ["SUPER_ADMIN"], []);
    expect(ctx.isSuperAdmin).toBe(true);
  });

  it("canRename: super admin, owner, or admin only", () => {
    expect(canRenameOrganization(selectOrganizationActorContext("owner-1", [], members))).toBe(
      true,
    );
    expect(canRenameOrganization(selectOrganizationActorContext("admin-1", [], members))).toBe(
      true,
    );
    expect(canRenameOrganization(selectOrganizationActorContext("member-1", [], members))).toBe(
      false,
    );
  });

  it("canDelete: super admin or owner only", () => {
    expect(canDeleteOrganization(selectOrganizationActorContext("owner-1", [], members))).toBe(
      true,
    );
    expect(canDeleteOrganization(selectOrganizationActorContext("admin-1", [], members))).toBe(
      false,
    );
  });

  it("canLeave: only when actor is a member of the org", () => {
    expect(
      canLeaveOrganization(selectOrganizationActorContext("member-1", [], members), members),
    ).toBe(true);
    expect(
      canLeaveOrganization(selectOrganizationActorContext("stranger", [], members), members),
    ).toBe(false);
  });
});
