import { describe, expect, it } from "vitest";

import type { RoleDto } from "../api-types";

import {
  buildRoleLookup,
  canAssignRole,
  filterRolesForOrganization,
  findPlatformUserRoleId,
  formatRoleName,
  getAssignableRoles,
  isOrganizationRole,
  isPrivilegedRoleName,
} from "../roles";

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

  it("does not deduplicate — dedup is handled by filterRolesForOrganization", () => {
    const rolesWithDuplicates: RoleDto[] = [
      { id: "1", name: "SUPER_ADMIN", scope: "platform" } as RoleDto,
      { id: "2", name: "ADMIN", scope: "platform" } as RoleDto,
      { id: "3", name: "ADMIN", scope: "organization" } as RoleDto,
      { id: "4", name: "ADMIN", scope: "organization" } as RoleDto,
      { id: "5", name: "USER", scope: "platform" } as RoleDto,
    ];

    expect(
      getAssignableRoles(["SUPER_ADMIN"], rolesWithDuplicates).length,
    ).toBe(4);
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

  it("getAssignableRoles returns all roles sorted alphabetically (no dedup) for SUPER_ADMIN", () => {
    const result = getAssignableRoles(["SUPER_ADMIN"], multiOrgRoles);
    // SUPER_ADMIN can assign all org roles + USER (but not SUPER_ADMIN which isn't in list)
    // Sorted by name: ACCOUNTANT(r3), ACCOUNTANT(r4), ADMIN(r2), MANAGER(r5), USER(r1), USER(r6)
    expect(result.map((r) => r.id)).toEqual([
      "r3",
      "r4",
      "r2",
      "r5",
      "r1",
      "r6",
    ]);
  });

  it("returns USER and org-scoped custom roles for org ADMIN sorted", () => {
    const result = getAssignableRoles(["ADMIN"], multiOrgRoles);
    // ADMIN cannot assign ADMIN role (r2), but can assign USER + custom
    // Sorted by name: ACCOUNTANT(r3), ACCOUNTANT(r4), MANAGER(r5), USER(r1), USER(r6)
    expect(result.map((r) => r.id)).toEqual(["r3", "r4", "r5", "r1", "r6"]);
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

describe("filterRolesForOrganization", () => {
  const roles: RoleDto[] = [
    { id: "p1", name: "USER", scope: "platform" } as RoleDto,
    { id: "p2", name: "USER", scope: "platform" } as RoleDto,
    {
      id: "o1",
      name: "ACCOUNTANT",
      scope: "organization",
      organizationId: "org-a" as unknown as Record<string, never> | null,
    } as unknown as RoleDto,
    {
      id: "o2",
      name: "ACCOUNTANT",
      scope: "organization",
      organizationId: "org-b" as unknown as Record<string, never> | null,
    } as unknown as RoleDto,
    {
      id: "o3",
      name: "MANAGER",
      scope: "organization",
      organizationId: "org-a" as unknown as Record<string, never> | null,
    } as unknown as RoleDto,
  ];

  it("shows only platform roles when no org is selected", () => {
    const result = filterRolesForOrganization(roles, null);
    expect(result.map((r) => r.id)).toEqual(["p1"]);
    // USER deduped to one entry
  });

  it("filters org-scoped roles by organization and dedupes names", () => {
    const result = filterRolesForOrganization(roles, "org-a");
    expect(result.map((r) => r.id)).toEqual(["p1", "o1", "o3"]);
  });

  it("shows same-named roles from different orgs", () => {
    const resultA = filterRolesForOrganization(roles, "org-a");
    const resultB = filterRolesForOrganization(roles, "org-b");
    expect(resultA.find((r) => r.name === "ACCOUNTANT")?.id).toBe("o1");
    expect(resultB.find((r) => r.name === "ACCOUNTANT")?.id).toBe("o2");
  });
});

describe("findPlatformUserRoleId", () => {
  it("prefers the platform USER role over the first organization role", () => {
    const result = findPlatformUserRoleId([
      {
        id: "accountant",
        name: "ACCOUNTANT",
        scope: "organization",
        organizationId: "org-a",
      } as unknown as RoleDto,
      {
        id: "user",
        name: "USER",
        scope: "platform",
        organizationId: null,
      } as unknown as RoleDto,
    ]);

    expect(result).toBe("user");
  });

  it("falls back to the first role only when platform USER is unavailable", () => {
    const result = findPlatformUserRoleId([
      {
        id: "accountant",
        name: "ACCOUNTANT",
        scope: "organization",
        organizationId: "org-a",
      } as unknown as RoleDto,
    ]);

    expect(result).toBe("accountant");
  });
});

describe("buildRoleLookup", () => {
  it("indexes roles by id", () => {
    const lookup = buildRoleLookup(roles);
    expect(lookup.get("2")?.name).toBe("ADMIN");
    expect(lookup.size).toBe(3);
  });
});
