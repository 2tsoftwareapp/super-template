import { describe, expect, it } from "vitest";

import type { RoleDto } from "./api-types";

import {
  buildRoleLookup,
  canAssignRole,
  formatRoleName,
  getAssignableRoles,
  isOrganizationRole,
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
    expect(
      getAssignableRoles(["SUPER_ADMIN"], roles).map((r) => r.name),
    ).toEqual(["ADMIN", "USER"]);
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

describe("isOrganizationRole", () => {
  it("returns true for organization-scoped roles", () => {
    expect(isOrganizationRole("ADMIN")).toBe(true);
    expect(isOrganizationRole("ACCOUNTANT")).toBe(true);
    expect(isOrganizationRole("MANAGER")).toBe(true);
  });

  it("returns false for platform roles", () => {
    expect(isOrganizationRole("USER")).toBe(false);
    expect(isOrganizationRole("SUPER_ADMIN")).toBe(false);
  });
});

describe("multi-org scenarios", () => {
  const multiOrgRoles: RoleDto[] = [
    { id: "r1", name: "USER", scope: "platform" } as RoleDto,
    { id: "r2", name: "ADMIN", scope: "organization" } as RoleDto,
    { id: "r3", name: "ACCOUNTANT", scope: "organization" } as RoleDto,
    { id: "r4", name: "ACCOUNTANT", scope: "organization" } as RoleDto,
    { id: "r5", name: "MANAGER", scope: "organization" } as RoleDto,
    { id: "r6", name: "USER", scope: "platform" } as RoleDto,
  ];

  it("deduplicates by name for SUPER_ADMIN across all orgs", () => {
    const result = getAssignableRoles(["SUPER_ADMIN"], multiOrgRoles);
    expect(result.map((r) => r.name)).toEqual([
      "ACCOUNTANT",
      "ADMIN",
      "MANAGER",
      "USER",
    ]);
  });

  it("returns USER and org-scoped custom roles for org ADMIN", () => {
    const result = getAssignableRoles(["ADMIN"], multiOrgRoles);
    expect(result.map((r) => r.name)).toEqual([
      "ACCOUNTANT",
      "MANAGER",
      "USER",
    ]);
  });

  it("returns org-specific custom roles plus USER for org ADMIN", () => {
    const orgRoles: RoleDto[] = [
      { id: "r1", name: "USER", scope: "platform" } as RoleDto,
      { id: "r2", name: "ACCOUNTANT", scope: "organization" } as RoleDto,
    ];
    const result = getAssignableRoles(["ADMIN"], orgRoles);
    expect(result.map((r) => r.name)).toEqual(["ACCOUNTANT", "USER"]);
  });

  it("prevents SUPER_ADMIN from being in assignable list", () => {
    const allRoles: RoleDto[] = [
      { id: "r1", name: "SUPER_ADMIN", scope: "platform" } as RoleDto,
      { id: "r2", name: "USER", scope: "platform" } as RoleDto,
    ];
    const result = getAssignableRoles(["SUPER_ADMIN"], allRoles);
    expect(result.map((r) => r.name)).not.toContain("SUPER_ADMIN");
    expect(result.map((r) => r.name)).toEqual(["USER"]);
  });
});

describe("buildRoleLookup", () => {
  it("indexes roles by id", () => {
    const lookup = buildRoleLookup(roles);
    expect(lookup.get("2")?.name).toBe("ADMIN");
    expect(lookup.size).toBe(3);
  });
});
