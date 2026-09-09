import { describe, expect, it } from "vitest";
import { UsersMapper } from "./users.mapper";

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

describe("UsersMapper", () => {
  it("maps nullable fields and derives role assignments", () => {
    const result = new UsersMapper().toUserView(
      {
        id: "user-1",
        email: "user@example.com",
        displayName: "User",
        avatarUrl: undefined,
        status: "ACTIVE",
        emailVerifiedAt: null,
        createdAt,
        updatedAt,
      },
      ["ADMIN", "MEMBER"],
      ["role-1"],
    );

    expect(result).toMatchObject({
      id: "user-1",
      avatarUrl: null,
      emailVerifiedAt: null,
      roles: ["ADMIN", "MEMBER"],
      memberOrganizationIds: [],
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    expect(result.roleAssignments).toEqual([
      { roleName: "ADMIN", roleId: "role-1", organizationId: null },
      { roleName: "MEMBER", roleId: "", organizationId: null },
    ]);
  });

  it("preserves explicit assignments and organization memberships", () => {
    const assignments = [{ roleName: "ADMIN", roleId: "role-1", organizationId: "org-1" }];
    const result = new UsersMapper().toUserView(
      {
        id: "user-1",
        email: "user@example.com",
        displayName: "User",
        avatarUrl: "avatar.png",
        status: "ACTIVE",
        emailVerifiedAt: createdAt,
        createdAt,
        updatedAt,
      },
      ["ADMIN"],
      ["role-1"],
      assignments,
      ["org-1"],
    );

    expect(result.avatarUrl).toBe("avatar.png");
    expect(result.emailVerifiedAt).toBe(createdAt.toISOString());
    expect(result.roleAssignments).toBe(assignments);
    expect(result.memberOrganizationIds).toEqual(["org-1"]);
  });
});
