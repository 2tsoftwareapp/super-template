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
  { id: "1", name: "SUPER_ADMIN" } as RoleDto,
  { id: "2", name: "ADMIN" } as RoleDto,
  { id: "3", name: "USER" } as RoleDto,
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
  it("lets a super admin assign any role", () => {
    expect(canAssignRole(["SUPER_ADMIN"], "ADMIN")).toBe(true);
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

  it("returns all roles for a super admin", () => {
    expect(getAssignableRoles(["SUPER_ADMIN"], roles)).toHaveLength(3);
  });
});

describe("buildRoleLookup", () => {
  it("indexes roles by id", () => {
    const lookup = buildRoleLookup(roles);
    expect(lookup.get("2")?.name).toBe("ADMIN");
    expect(lookup.size).toBe(3);
  });
});
