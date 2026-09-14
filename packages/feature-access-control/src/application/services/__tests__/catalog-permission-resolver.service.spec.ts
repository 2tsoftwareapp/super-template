import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { describe, expect, it, vi } from "vitest";

import { AccessControlMapper } from "../../access-control.mapper";
import { CatalogPermissionResolver } from "../catalog-permission-resolver.service";

const TX = "tx" as unknown;

const permission = {
  id: "perm-1",
  name: "users.read",
  description: null,
  isSystem: true,
  scope: "organization",
};

function buildResolver(permissions: unknown[]) {
  const repository = { findPermissionsByIds: vi.fn(async () => permissions) };
  return {
    repository,
    resolver: new CatalogPermissionResolver(repository as never, new AccessControlMapper()),
  };
}

describe("CatalogPermissionResolver", () => {
  it("rejects ids that do not resolve to a catalog row", async () => {
    const { resolver } = buildResolver([]);

    await expect(
      resolver.resolve({
        actor: { roles: ["ADMIN"], permissions: ["users.read"] } as never,
        permissionIds: ["perm-1"],
        targetOrganizationId: "org-1",
        executor: TX,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.VALIDATION_FAILED });
  });

  it("applies the delegation policy to the resolved rows", async () => {
    const { resolver } = buildResolver([permission]);

    await expect(
      resolver.resolve({
        actor: { roles: ["ADMIN"], permissions: ["roles.create"] } as never,
        permissionIds: ["perm-1"],
        targetOrganizationId: "org-1",
        executor: TX,
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.AUTH_FORBIDDEN });
  });

  it("maps resolved rows to permission views for an authorized actor", async () => {
    const { resolver, repository } = buildResolver([permission]);

    const views = await resolver.resolve({
      actor: { roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN], permissions: [] } as never,
      permissionIds: ["perm-1"],
      targetOrganizationId: "org-1",
      executor: TX,
    });

    expect(repository.findPermissionsByIds).toHaveBeenCalledWith(["perm-1"], TX);
    expect(views).toEqual([
      {
        id: "perm-1",
        name: "users.read",
        description: null,
        isSystem: true,
        scope: "organization",
      },
    ]);
  });
});
