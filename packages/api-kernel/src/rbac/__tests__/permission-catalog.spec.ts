import { beforeEach, describe, expect, it } from "vitest";

import { allSeedPermissionNames } from "../default-role-grants.matrix";
import {
  scopeForPermission,
  setResourceScopeCatalog,
} from "../permission-catalog";

describe("Permission Catalog Completeness", () => {
  beforeEach(() => {
    setResourceScopeCatalog({
      settings: "platform",
      audit: "platform",
      mail: "platform",
      jobs: "platform",
      users: "organization",
      roles: "organization",
      notifications: "organization",
      files: "organization",
      attachments: "organization",
      imports: "organization",
      exports: "organization",
      activities: "organization",
    });
  });

  it("should resolve a valid scope for all seeded permissions without fallback", () => {
    const seedPermissions = allSeedPermissionNames();
    expect(seedPermissions.length).toBeGreaterThan(0);

    for (const permission of seedPermissions) {
      const resource = permission.split(".")[0]!;
      const scope = scopeForPermission(permission);

      expect(
        scope,
        `Resource '${resource}' (from permission '${permission}') should be catalogued`,
      ).toBeDefined();
      expect(["platform", "organization"]).toContain(scope);
      // Known seeded resources must not rely on fail-closed default alone when catalog is installed.
      if (resource !== "unknown") {
        expect(scopeForPermission(`${resource}.read`)).not.toBeUndefined();
      }
    }
  });

  it("should map unknown resources to platform (fail-closed)", () => {
    expect(scopeForPermission("unknown.read")).toBe("platform");
    expect(scopeForPermission("random.create")).toBe("platform");
  });

  it("should map known resources to their correct scopes", () => {
    expect(scopeForPermission("users.read")).toBe("organization");
    expect(scopeForPermission("audit.read")).toBe("platform");
  });
});
