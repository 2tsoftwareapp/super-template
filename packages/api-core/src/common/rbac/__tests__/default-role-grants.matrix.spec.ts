import { describe, expect, it } from "vitest";

import {
  allSeedPermissionNames,
  DEFAULT_ROLE_GRANTS,
  permissionNamesForRole,
  permissionNamesFromGrantSpec,
} from "../default-role-grants.matrix";
import { ROLE_NAMES } from "../role.constants";

describe("default role grants matrix", () => {
  it("expands the SUPER_ADMIN wildcard to the full seed permission set", () => {
    expect(permissionNamesFromGrantSpec("*")).toEqual(allSeedPermissionNames());
  });

  it("expands a role grant spec into resource.action names", () => {
    const names = permissionNamesForRole(ROLE_NAMES.USER);
    expect(names).toContain("files.read");
    expect(names).toContain("files.delete");
    expect(names).toContain("notifications.read");
    // USER has read-only notifications
    expect(names).not.toContain("notifications.delete");
  });

  it("returns a deduplicated, sorted union for the seed permission set", () => {
    const all = allSeedPermissionNames();
    const sorted = [...all].sort();
    expect(all).toEqual(sorted);
    expect(new Set(all).size).toBe(all.length);
    // every entry is a resource.action pair
    expect(all.every((name) => /^[a-z]+\.[a-z]+$/.test(name))).toBe(true);
  });

  it("grants ADMIN strictly more permissions than USER", () => {
    const admin = new Set(permissionNamesForRole(ROLE_NAMES.ADMIN));
    const user = permissionNamesForRole(ROLE_NAMES.USER);
    expect(user.every((name) => admin.has(name))).toBe(true);
    expect(admin.size).toBeGreaterThan(user.length);
  });

  it("keeps SUPER_ADMIN as a wildcard spec", () => {
    expect(DEFAULT_ROLE_GRANTS[ROLE_NAMES.SUPER_ADMIN]).toBe("*");
  });
});
