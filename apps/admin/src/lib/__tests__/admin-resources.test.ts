import { describe, expect, it } from "vitest";

import {
  adminResources,
  canAccessResource,
  getFirstAccessibleResourcePath,
  getResourceForPath,
  hasAdminAppAccess,
} from "../admin-resources";

describe("admin resource registry", () => {
  it("defines stable resource ids and paths", () => {
    expect(adminResources.map((resource) => resource.id)).toEqual([
      "dashboard",
      "organizations",
      "users",
      "roles",
      "audit-logs",
      "notifications",
      "jobs",
      "mail",
      "files",
      "imports",
      "settings",
    ]);
  });

  it("matches nested paths to their parent resource", () => {
    expect(getResourceForPath("/users/123")?.id).toBe("users");
    expect(getResourceForPath("/notifications")?.id).toBe("notifications");
    expect(getResourceForPath("/unknown")?.id).toBe("dashboard");
  });

  it("checks resource access using any configured permission", () => {
    const users = adminResources.find((resource) => resource.id === "users");
    const dashboard = adminResources.find((resource) => resource.id === "dashboard");

    expect(users).toBeDefined();
    expect(dashboard).toBeDefined();
    expect(canAccessResource(users!, ["users.read"])).toBe(true);
    expect(canAccessResource(users!, ["files.read"])).toBe(false);
    expect(canAccessResource(dashboard!, [])).toBe(true);
  });

  it("recognizes admin-app access from admin permissions", () => {
    expect(hasAdminAppAccess({ permissions: ["users.read"] })).toBe(true);
    expect(hasAdminAppAccess({ permissions: ["roles.read"] })).toBe(true);
    expect(hasAdminAppAccess({ permissions: [] })).toBe(false);
  });

  it("allows super admins into the app even before permission expansion", () => {
    expect(hasAdminAppAccess({ roles: ["SUPER_ADMIN"], permissions: [] })).toBe(true);
  });

  it("returns the first accessible route for a permission set", () => {
    expect(getFirstAccessibleResourcePath(["files.read"])).toBe("/files");
    expect(getFirstAccessibleResourcePath(["users.read"])).toBe("/users");
    expect(getFirstAccessibleResourcePath([])).toBe("/");
  });
});
