import { describe, expect, it } from "vitest";

import type { UserRecord } from "../ports/users.repository.port";

import { UsersMapper } from "../users.mapper";

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");

/** A complete persisted row: UserRecord has no optional fields, so the mapper's
 *  inputs must be whole records rather than hand-written fragments. */
const buildUserRecord = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: "user-1",
  email: "user@example.com",
  passwordHash: "hashed-password",
  displayName: "User",
  avatarUrl: null,
  avatarFileId: null,
  status: "ACTIVE",
  emailVerifiedAt: null,
  mustChangePassword: false,
  deletedAt: null,
  createdAt,
  updatedAt,
  ...overrides,
});

describe("UsersMapper", () => {
  it("maps nullable fields and derives role assignments", () => {
    const result = new UsersMapper().toUserView(
      buildUserRecord({ avatarUrl: null, emailVerifiedAt: null }),
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
      buildUserRecord({ avatarUrl: "avatar.png", emailVerifiedAt: createdAt }),
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
