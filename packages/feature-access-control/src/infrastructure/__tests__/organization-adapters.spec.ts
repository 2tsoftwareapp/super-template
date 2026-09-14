import { describe, expect, it, vi } from "vitest";

import {
  ORGANIZATION_ACCESS_CONTROL,
  ORGANIZATION_CUSTOM_ROLES_PURGE,
} from "@repo/feature-organizations/contracts";

import {
  ORGANIZATION_ACCESS_CONTROL_PROVIDER,
  OrganizationAccessControlAdapter,
} from "../organization-access-control.adapter";
import {
  ORGANIZATION_CUSTOM_ROLES_PURGE_PROVIDER,
  OrganizationCustomRolesPurgeAdapter,
} from "../organization-custom-roles-purge.adapter";

describe("OrganizationAccessControlAdapter", () => {
  function build() {
    const accessControl = {
      ensureOrganizationAdminRole: vi.fn(async () => undefined),
      replaceUserRoles: vi.fn(async () => undefined),
      invalidateAccessProfile: vi.fn(async () => undefined),
    };

    return { accessControl, adapter: new OrganizationAccessControlAdapter(accessControl as never) };
  }

  it("delegates ensureOrganizationAdminRole with the executor intact", async () => {
    const { adapter, accessControl } = build();
    const executor = { id: "tx" };

    await adapter.ensureOrganizationAdminRole("org-1", "user-1", executor as never);

    expect(accessControl.ensureOrganizationAdminRole).toHaveBeenCalledWith(
      "org-1",
      "user-1",
      executor,
    );
  });

  it("forwards a null organization for platform-scoped role replacement", async () => {
    const { adapter, accessControl } = build();

    await adapter.replaceUserRoles("user-1", ["role-1"], null);

    // The null must survive: it means "platform scope", not "no scope".
    expect(accessControl.replaceUserRoles).toHaveBeenCalledWith(
      "user-1",
      ["role-1"],
      null,
      undefined,
    );
  });

  it("forwards a tenant organization for organization-scoped role replacement", async () => {
    const { adapter, accessControl } = build();
    const executor = { id: "tx" };

    await adapter.replaceUserRoles("user-1", ["role-2"], "org-1", executor as never);

    expect(accessControl.replaceUserRoles).toHaveBeenCalledWith(
      "user-1",
      ["role-2"],
      "org-1",
      executor,
    );
  });

  it("delegates profile invalidation", async () => {
    const { adapter, accessControl } = build();

    await adapter.invalidateAccessProfile("user-1");

    expect(accessControl.invalidateAccessProfile).toHaveBeenCalledWith("user-1");
  });

  it("binds the organizations-owned token to this adapter", () => {
    // `useExisting` is what makes a missing adapter a boot-time failure rather
    // than a silent no-op: the token resolves to this class or Nest refuses to
    // start. Asserted here because the failure itself needs a Nest container.
    expect(ORGANIZATION_ACCESS_CONTROL_PROVIDER).toEqual({
      provide: ORGANIZATION_ACCESS_CONTROL,
      useExisting: OrganizationAccessControlAdapter,
    });
  });
});

describe("OrganizationCustomRolesPurgeAdapter", () => {
  it("delegates the purge for the organization and passes the executor through", async () => {
    const rolePersistence = { deleteByOrganizationId: vi.fn(async () => undefined) };
    const adapter = new OrganizationCustomRolesPurgeAdapter(rolePersistence as never);
    const executor = { id: "tx" };

    await adapter.deleteByOrganizationId("org-1", executor as never);

    expect(rolePersistence.deleteByOrganizationId).toHaveBeenCalledWith("org-1", executor);
  });

  it("binds the organizations-owned token to this adapter", () => {
    expect(ORGANIZATION_CUSTOM_ROLES_PURGE_PROVIDER).toEqual({
      provide: ORGANIZATION_CUSTOM_ROLES_PURGE,
      useExisting: OrganizationCustomRolesPurgeAdapter,
    });
  });
});
