import type { OrganizationMembership } from "../../public/organization-membership.port";

import { GLOBAL_MODULE_METADATA, MODULE_METADATA } from "@nestjs/common/constants";
import { USER_ORGANIZATION_SCOPE } from "@repo/feature-users/contracts";
import { describe, expect, it, vi } from "vitest";

import { OrganizationsModule } from "../../organizations.module";
import { UserOrganizationScopeAdapter } from "../user-organization-scope.adapter";

function buildMembership(overrides: Partial<OrganizationMembership> = {}): OrganizationMembership {
  return {
    findMembership: vi.fn(async () => null),
    findUserIdsForOrganization: vi.fn(async () => []),
    ...overrides,
  } as unknown as OrganizationMembership;
}

describe("UserOrganizationScopeAdapter", () => {
  it("reports membership from the organization membership port", async () => {
    const membership = buildMembership({
      findMembership: vi.fn(async () => ({ organizationId: "org-1", userId: "user-1" })) as never,
    });
    const adapter = new UserOrganizationScopeAdapter(membership);

    await expect(adapter.isMember("user-1", "org-1", "tx" as never)).resolves.toBe(true);
    expect(membership.findMembership).toHaveBeenCalledWith("org-1", "user-1", "tx");
  });

  it("reports a missing membership as false", async () => {
    const adapter = new UserOrganizationScopeAdapter(buildMembership());

    await expect(adapter.isMember("user-1", "org-1", "tx" as never)).resolves.toBe(false);
  });

  it("filters requested ids down to organization members", async () => {
    const membership = buildMembership({
      findUserIdsForOrganization: vi.fn(async () => ["user-2"]),
    });
    const adapter = new UserOrganizationScopeAdapter(membership);

    await expect(
      adapter.filterMemberUserIds(["user-2", "user-3"], "org-1", "tx" as never),
    ).resolves.toEqual(["user-2"]);
    expect(membership.findUserIdsForOrganization).toHaveBeenCalledWith("org-1", "tx");
  });

  it("short-circuits an empty id list without querying memberships", async () => {
    const membership = buildMembership();
    const adapter = new UserOrganizationScopeAdapter(membership);

    await expect(adapter.filterMemberUserIds([], "org-1", "tx" as never)).resolves.toEqual([]);
    expect(membership.findUserIdsForOrganization).not.toHaveBeenCalled();
  });

  it("lists every organization member id", async () => {
    const membership = buildMembership({
      findUserIdsForOrganization: vi.fn(async () => ["user-1", "user-2"]),
    });
    const adapter = new UserOrganizationScopeAdapter(membership);

    await expect(adapter.listMemberUserIds("org-1", "tx" as never)).resolves.toEqual([
      "user-1",
      "user-2",
    ]);
  });
});

/**
 * The port is only useful if Nest can actually resolve it from the users graph:
 * `feature-users` injects it optionally, so a missing binding would degrade to a
 * runtime failure instead of a boot error. Assert the module wiring directly.
 */
describe("OrganizationsModule — USER_ORGANIZATION_SCOPE binding", () => {
  it("provides and exports the port from the global module", () => {
    const providers = (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, OrganizationsModule) ??
      []) as unknown[];
    const moduleExports = (Reflect.getMetadata(MODULE_METADATA.EXPORTS, OrganizationsModule) ??
      []) as unknown[];

    expect(Reflect.getMetadata(GLOBAL_MODULE_METADATA, OrganizationsModule)).toBe(true);
    expect(providers).toContainEqual({
      provide: USER_ORGANIZATION_SCOPE,
      useExisting: UserOrganizationScopeAdapter,
    });
    expect(moduleExports).toContain(USER_ORGANIZATION_SCOPE);
  });
});
