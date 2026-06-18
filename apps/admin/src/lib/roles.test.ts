import { describe, expect, it } from "vitest";

import type { RoleDto } from "./types";

import {
  buildRoleLookup,
  canAssignRole,
  formatRoleName,
  getAssignableRoles,
  isPrivilegedRoleName,
} from "./roles";

const roles: RoleDto[] = [
  { id: "1", name: "SUPER_ADMIN", scope: "platform" } as RoleDto,
  { id: "2", name: "ADMIN", scope: "platform" } as RoleDto,
  { id: "3", name: "USER", scope: "platform" } as RoleDto,
];

describe("formatRoleName", () => {
  it("lowercases and replaces underscores with spaces", () => {
    expect(formatRoleName("SUPER_ADMIN")).toBe("super admin");
  });
});

describe("isPrivilegedRoleName", () => {
  it("recognizes privileged role names", () => {
    expect(isPrivilegedRoleName("SUPER_ADMIN")).toBe(true);
    expect(isPrivilegedRoleName("ADMIN")).toBe(true);
  });

  it("rejects non-privileged role names", () => {
    expect(isPrivilegedRoleName("USER")).toBe(false);
  });
});

describe("canAssignRole", () => {
  it("blocks SUPER_ADMIN for everyone", () => {
    expect(canAssignRole(["SUPER_ADMIN"], "SUPER_ADMIN")).toBe(false);
    expect(canAssignRole(["ADMIN"], "SUPER_ADMIN")).toBe(false);
  });

  it("lets a super admin assign ADMIN and USER", () => {
    expect(canAssignRole(["SUPER_ADMIN"], "ADMIN")).toBe(true);
    expect(canAssignRole(["SUPER_ADMIN"], "USER")).toBe(true);
  });

  it("limits non-super-admins to the USER role", () => {
    expect(canAssignRole(["ADMIN"], "ADMIN")).toBe(false);
    expect(canAssignRole(["ADMIN"], "USER")).toBe(true);
  });
});

describe("getAssignableRoles", () => {
  it("returns only USER for a plain admin", () => {
    expect(getAssignableRoles(["ADMIN"], roles).map((r) => r.name)).toEqual([
      "USER",
    ]);
  });

  it("returns ADMIN and USER for a super admin", () => {
    expect(getAssignableRoles(["SUPER_ADMIN"], roles).map((r) => r.name)).toEqual([
      "ADMIN",
      "USER",
    ]);
  });

  it("deduplicates by name and prefers platform roles in the picker", () => {
    const rolesWithOrgScopedDuplicates: RoleDto[] = [
      { id: "1", name: "SUPER_ADMIN", scope: "platform" } as RoleDto,
      { id: "2", name: "ADMIN", scope: "platform" } as RoleDto,
      { id: "3", name: "ADMIN", scope: "organization" } as RoleDto,
      { id: "4", name: "ADMIN", scope: "organization" } as RoleDto,
      { id: "5", name: "USER", scope: "platform" } as RoleDto,
    ];

    expect(
      getAssignableRoles(["SUPER_ADMIN"], rolesWithOrgScopedDuplicates).map(
        (r) => r.id,
      ),
    ).toEqual(["2", "5"]);
  });
});

describe("buildRoleLookup", () => {
  it("indexes roles by id", () => {
    const lookup = buildRoleLookup(roles);
    expect(lookup.get("2")?.name).toBe("ADMIN");
    expect(lookup.size).toBe(3);
  });
});
