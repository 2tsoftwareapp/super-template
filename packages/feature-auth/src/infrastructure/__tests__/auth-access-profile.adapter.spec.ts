import type { TransactionExecutor } from "@repo/api-kernel";

import { MODULE_METADATA } from "@nestjs/common/constants";
import { AccessControlService } from "@repo/feature-access-control/contracts";
import { describe, expect, it, vi } from "vitest";

import { AuthModule } from "../../auth.module";
import {
  AUTH_ACCESS_PROFILE,
  type AuthAccessProfile,
} from "../../public/auth-access-profile.port";
import { AuthAccessProfileAdapter } from "../auth-access-profile.adapter";

const buildAccessControlService = () =>
  ({
    getAccessProfile: vi.fn(async () => ({ roles: ["USER"], permissions: ["users:read"] })),
    getAccessProfileStrong: vi.fn(async () => ({ roles: ["USER"], permissions: ["users:read"] })),
    getRoleByName: vi.fn(async () => ({
      id: "role-user",
      organizationId: null,
      name: "USER",
      description: null,
      isSystem: true,
    })),
    replaceUserRoles: vi.fn(async () => ({ assigned: true })),
  }) as unknown as AccessControlService;

describe("AuthAccessProfileAdapter", () => {
  it("projects every port method onto the access-control service", async () => {
    const accessControlService = buildAccessControlService();
    const adapter = new AuthAccessProfileAdapter(accessControlService);
    const executor = "tx" as unknown as TransactionExecutor;

    await expect(adapter.getAccessProfile("user-1", "org-1")).resolves.toEqual({
      roles: ["USER"],
      permissions: ["users:read"],
    });
    await expect(adapter.getAccessProfileStrong("user-1", "org-1")).resolves.toEqual({
      roles: ["USER"],
      permissions: ["users:read"],
    });
    await expect(adapter.getRoleByName("USER", null, executor)).resolves.toMatchObject({
      id: "role-user",
    });
    await adapter.replaceUserRoles("user-1", ["role-user"], null, executor);

    expect(accessControlService.getAccessProfile).toHaveBeenCalledWith("user-1", "org-1");
    // Strong reads must stay strong: the adapter must not fall back to the cached read.
    expect(accessControlService.getAccessProfileStrong).toHaveBeenCalledWith("user-1", "org-1");
    expect(accessControlService.getRoleByName).toHaveBeenCalledWith("USER", null, executor);
    expect(accessControlService.replaceUserRoles).toHaveBeenCalledWith(
      "user-1",
      ["role-user"],
      null,
      executor,
    );
  });
});

/**
 * The use cases inject the port, so a missing or renamed binding would only
 * surface when Nest builds the auth graph. Assert the module wiring directly:
 * the reachable implementation must be the adapter, bound with `useExisting`
 * (single instance), and exported for other features that need the same shape.
 *
 * End-to-end proof that Nest can resolve it: the auth flows that inject these
 * ports (register, login, refresh, switch-organization) are covered by
 * apps/api/test/*.e2e.spec.ts — the app would fail to boot without the bindings.
 */
describe("AuthModule — auth-owned port bindings", () => {
  it("binds AUTH_ACCESS_PROFILE to AuthAccessProfileAdapter and exports it", () => {
    const providers = (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) ??
      []) as unknown[];
    const moduleExports = (Reflect.getMetadata(MODULE_METADATA.EXPORTS, AuthModule) ??
      []) as unknown[];

    expect(providers).toContainEqual({
      provide: AUTH_ACCESS_PROFILE,
      useExisting: AuthAccessProfileAdapter,
    });
    expect(providers).toContain(AuthAccessProfileAdapter);
    expect(moduleExports).toContain(AUTH_ACCESS_PROFILE);
  });

  it("is swappable: a test double satisfies the port the use cases inject", () => {
    // The seam is only real if the port can be replaced without touching the
    // use cases. `AuthAccessProfileAdapter` is one implementation, this is
    // another — both assignable to the same auth-owned type.
    const fake: AuthAccessProfile = {
      getAccessProfile: vi.fn(async () => ({ roles: [], permissions: [] })),
      getAccessProfileStrong: vi.fn(async () => ({ roles: [], permissions: [] })),
      getRoleByName: vi.fn(async () => null),
      replaceUserRoles: vi.fn(async () => undefined),
    };
    const implementations: AuthAccessProfile[] = [
      new AuthAccessProfileAdapter(buildAccessControlService()),
      fake,
    ];

    expect(implementations).toHaveLength(2);
  });
});
