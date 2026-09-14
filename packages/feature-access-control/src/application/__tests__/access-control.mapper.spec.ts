import { describe, expect, it } from "vitest";

import { AccessControlMapper } from "../access-control.mapper";

const mapper = new AccessControlMapper();

const permission = {
  id: "perm-1",
  name: "files.read",
  description: "Read files",
  isSystem: true,
  scope: "organization" as const,
};

describe("AccessControlMapper.toPermissionView", () => {
  it("copies the permission fields onto the view", () => {
    expect(mapper.toPermissionView(permission)).toEqual({
      id: "perm-1",
      name: "files.read",
      description: "Read files",
      isSystem: true,
      scope: "organization",
    });
  });

  it("preserves a missing description", () => {
    expect(mapper.toPermissionView({ ...permission, description: null })).toMatchObject({
      description: null,
    });
  });
});

describe("AccessControlMapper.toRoleView", () => {
  it("derives platform scope from an organization-less role", () => {
    expect(
      mapper.toRoleView({
        id: "role-1",
        organizationId: null,
        name: "SUPER_ADMIN",
        description: null,
        isSystem: true,
      }),
    ).toEqual({
      id: "role-1",
      organizationId: null,
      name: "SUPER_ADMIN",
      description: null,
      scope: "platform",
      isSystem: true,
      permissions: [],
    });
  });

  it("derives organization scope from a tenant-bound role", () => {
    expect(
      mapper.toRoleView({
        id: "role-2",
        organizationId: "org-1",
        name: "ADMIN",
        description: "Tenant admin",
        isSystem: true,
      }),
    ).toMatchObject({ organizationId: "org-1", scope: "organization" });
  });

  it("attaches the permissions it is given", () => {
    const result = mapper.toRoleView(
      { id: "role-2", organizationId: "org-1", name: "ADMIN", description: null, isSystem: true },
      [permission],
    );

    expect(result.permissions).toEqual([permission]);
  });

  it("does not invent permissions when none are supplied", () => {
    const result = mapper.toRoleView({
      id: "role-3",
      organizationId: "org-1",
      name: "VIEWER",
      description: null,
      isSystem: false,
    });

    expect(result.permissions).toEqual([]);
  });
});
