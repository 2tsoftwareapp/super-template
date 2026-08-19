import { describe, expect, it } from "vitest";

import type { ManagedRoleDto } from "../roles.schemas";

import {
  filterRolesBySearch,
  mergeCustomRoles,
  mergeSystemRoles,
  optionalText,
} from "../roles.filtering";

const systemRole = (overrides: Partial<ManagedRoleDto> = {}): ManagedRoleDto => ({
  id: "r1",
  name: "ADMIN",
  description: "System admin",
  isSystem: true,
  permissions: [],
  organizationId: null,
  scope: "platform",
  ...overrides,
});

const customRole = (overrides: Partial<ManagedRoleDto> = {}): ManagedRoleDto => ({
  id: "cr-1",
  name: "Finance Manager",
  description: "Manages finances",
  isSystem: false,
  permissions: [],
  organizationId: "org-1",
  scope: "organization",
  ...overrides,
});

describe("optionalText", () => {
  it("returns empty string for null", () => {
    expect(optionalText(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(optionalText(undefined)).toBe("");
  });

  it("returns empty string for object", () => {
    expect(optionalText({ foo: "bar" })).toBe("");
  });

  it("returns the string as-is", () => {
    expect(optionalText("hello")).toBe("hello");
  });
});

describe("mergeSystemRoles", () => {
  it("keeps each role as a separate entry with its own scope", () => {
    const roles = [
      systemRole({
        scope: "platform",
        permissions: [
          { id: "p1", name: "users.read", description: null, isSystem: true, scope: "platform" },
        ],
      }),
      systemRole({ id: "r2", scope: "organization", permissions: [] }),
    ];

    const result = mergeSystemRoles(roles);

    expect(result).toHaveLength(2);
    expect(result[0]!.scopes).toEqual(["platform"]);
    expect(result[1]!.scopes).toEqual(["organization"]);
  });

  it("preserves each role's own permission set", () => {
    const roles = [
      systemRole({
        scope: "platform",
        permissions: [
          { id: "p1", name: "users.read", description: null, isSystem: true, scope: "platform" },
        ],
      }),
      systemRole({
        id: "r2",
        scope: "organization",
        permissions: [
          { id: "p1", name: "users.read", description: null, isSystem: true, scope: "platform" },
          { id: "p2", name: "users.write", description: null, isSystem: true, scope: "platform" },
        ],
      }),
    ];

    const result = mergeSystemRoles(roles);

    expect(result).toHaveLength(2);
    expect(result[0]!.permissions).toHaveLength(1);
    expect(result[1]!.permissions).toHaveLength(2);
  });

  it("sorts results alphabetically by name", () => {
    const roles = [
      systemRole({ id: "r1", name: "ZOOM_ADMIN" }),
      systemRole({ id: "r2", name: "AUDITOR" }),
      systemRole({ id: "r3", name: "BASE_USER" }),
    ];

    const result = mergeSystemRoles(roles);

    expect(result.map((r) => r.name)).toEqual(["AUDITOR", "BASE_USER", "ZOOM_ADMIN"]);
  });

  it("returns empty array for empty input", () => {
    expect(mergeSystemRoles([])).toEqual([]);
  });
});

describe("mergeCustomRoles", () => {
  it("does NOT merge roles with the same name from different orgs", () => {
    const roles = [
      customRole({ id: "cr-1", organizationId: "org-1" }),
      customRole({ id: "cr-2", name: "Finance Manager", organizationId: "org-2" }),
    ];

    const result = mergeCustomRoles(roles);

    expect(result).toHaveLength(2);
  });

  it("combines scopes for the same role id", () => {
    const roles = [
      customRole({ id: "cr-1", scope: "organization" }),
      customRole({ id: "cr-1", scope: "platform" }),
    ];

    const result = mergeCustomRoles(roles);

    expect(result).toHaveLength(1);
    expect(result[0]!.scopes).toContain("organization");
    expect(result[0]!.scopes).toContain("platform");
  });

  it("sorts alphabetically by name", () => {
    const roles = [
      customRole({ id: "cr-1", name: "Z Admin" }),
      customRole({ id: "cr-2", name: "Auditor" }),
    ];

    const result = mergeCustomRoles(roles);

    expect(result.map((r) => r.name)).toEqual(["Auditor", "Z Admin"]);
  });

  it("returns empty array for empty input", () => {
    expect(mergeCustomRoles([])).toEqual([]);
  });
});

describe("filterRolesBySearch", () => {
  const roles = [
    { name: "Admin", description: "Full system access", permissions: [], scopes: ["platform"] },
    {
      name: "Finance Manager",
      description: null,
      permissions: [
        { id: "p1", name: "finance.read", description: null, isSystem: true, scope: "platform" },
      ],
      scopes: ["organization"],
    },
    {
      name: "Auditor",
      description: "Read-only",
      permissions: [
        { id: "p2", name: "audit.view", description: null, isSystem: true, scope: "platform" },
      ],
      scopes: ["organization"],
    },
  ] as const;

  it("returns all for empty search", () => {
    expect(filterRolesBySearch([...roles] as never, "")).toHaveLength(3);
  });

  it("filters by name (case-insensitive)", () => {
    const result = filterRolesBySearch([...roles] as never, "finance");
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Finance Manager");
  });

  it("filters by description", () => {
    const result = filterRolesBySearch([...roles] as never, "read");
    expect(result).toHaveLength(2);
  });

  it("filters by permission name", () => {
    const result = filterRolesBySearch([...roles] as never, "audit");
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Auditor");
  });
});
