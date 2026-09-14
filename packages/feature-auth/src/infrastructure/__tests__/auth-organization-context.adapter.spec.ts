import type { TransactionExecutor } from "@repo/api-kernel";

import { MODULE_METADATA } from "@nestjs/common/constants";
import { OrganizationsService } from "@repo/feature-organizations/module";
import { describe, expect, it, vi } from "vitest";

import { AuthModule } from "../../auth.module";
import {
  AUTH_ORGANIZATION_CONTEXT,
  type AuthOrganizationContext,
} from "../../public/auth-organization-context.port";
import { AuthOrganizationContextAdapter } from "../auth-organization-context.adapter";

const buildOrganizationsService = () =>
  ({
    resolveOrganizationIdForUser: vi.fn(async () => "org-1"),
    assertMembership: vi.fn(async () => ({ organizationId: "org-1", userId: "user-1" })),
  }) as unknown as OrganizationsService;

describe("AuthOrganizationContextAdapter", () => {
  it("projects organization resolution onto the auth-owned port", async () => {
    const organizationsService = buildOrganizationsService();
    const adapter = new AuthOrganizationContextAdapter(organizationsService);

    await expect(adapter.resolveOrganizationIdForUser("user-1", "org-1")).resolves.toBe("org-1");
    expect(organizationsService.resolveOrganizationIdForUser).toHaveBeenCalledWith(
      "user-1",
      "org-1",
      undefined,
    );
  });

  it("passes the transaction executor through and normalizes membership to void", async () => {
    const organizationsService = buildOrganizationsService();
    const adapter = new AuthOrganizationContextAdapter(organizationsService);
    const executor = "tx" as unknown as TransactionExecutor;

    await expect(adapter.assertMembership("org-1", "user-1", executor)).resolves.toBeUndefined();
    expect(organizationsService.assertMembership).toHaveBeenCalledWith("org-1", "user-1", executor);
  });

  it("propagates the membership failure instead of swallowing it", async () => {
    const organizationsService = buildOrganizationsService();
    organizationsService.assertMembership = vi.fn(async () => {
      throw new Error("not a member");
    });
    const adapter = new AuthOrganizationContextAdapter(organizationsService);

    await expect(adapter.assertMembership("org-1", "user-1")).rejects.toThrow("not a member");
  });
});

describe("AuthModule — AUTH_ORGANIZATION_CONTEXT binding", () => {
  it("binds the port to AuthOrganizationContextAdapter and exports it", () => {
    const providers = (Reflect.getMetadata(MODULE_METADATA.PROVIDERS, AuthModule) ??
      []) as unknown[];
    const moduleExports = (Reflect.getMetadata(MODULE_METADATA.EXPORTS, AuthModule) ??
      []) as unknown[];

    expect(providers).toContainEqual({
      provide: AUTH_ORGANIZATION_CONTEXT,
      useExisting: AuthOrganizationContextAdapter,
    });
    expect(providers).toContain(AuthOrganizationContextAdapter);
    expect(moduleExports).toContain(AUTH_ORGANIZATION_CONTEXT);
  });

  it("is swappable: a test double satisfies the port the use cases inject", () => {
    const fake: AuthOrganizationContext = {
      resolveOrganizationIdForUser: vi.fn(async () => null),
      assertMembership: vi.fn(async () => undefined),
    };
    const implementations: AuthOrganizationContext[] = [
      new AuthOrganizationContextAdapter(buildOrganizationsService()),
      fake,
    ];

    expect(implementations).toHaveLength(2);
  });
});
