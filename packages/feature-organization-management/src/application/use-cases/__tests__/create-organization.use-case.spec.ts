import type { AuthenticatedRequestUser, TenantContext } from "@repo/api-kernel";
import { getTenantContext, TenantContextService } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import { CreateOrganizationUseCase } from "../create-organization.use-case";

/**
 * Caller already scoped to an active organization, exactly as the
 * tenant-context interceptor leaves a normal request. Creating a second
 * organization therefore targets an organization that is *not* the ambient
 * tenant — the mismatch `EmitActivityUseCase` is fail-closed about (B-08).
 */
const CALLER_CONTEXT: TenantContext = {
  tenantId: "org-caller",
  userId: "u1",
  bypassRls: false,
};

const actor: AuthenticatedRequestUser = {
  userId: "u1",
  sessionId: "session-u1",
  email: "u1@example.local",
  displayName: "u1",
  status: "ACTIVE",
  roles: ["USER"],
  permissions: [],
  organizationId: "org-caller",
};

function buildHarness() {
  const organizationsRepository = {
    findBySlug: vi.fn(async () => null),
    createOrganization: vi.fn(async (values: { name: string; slug: string }) => ({
      id: "org-created",
      name: values.name,
      slug: values.slug,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    })),
  };
  const membership = { addMember: vi.fn(async () => null) };
  const accessControl = { ensureOrganizationAdminRole: vi.fn(async () => undefined) };

  // Mirrors what EmitActivityUseCase reads: the ambient tenant context is the
  // authority for the activity's organizationId, so capture it at emit time.
  let contextAtEmit: TenantContext | undefined;
  const activityEmitter = {
    emit: vi.fn(async () => {
      contextAtEmit = getTenantContext();
    }),
  };

  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn("tx")),
  };

  const tenantContextService = new TenantContextService();

  return {
    tenantContextService,
    activityEmitter,
    membership,
    accessControl,
    contextAtEmit: () => contextAtEmit,
    useCase: new CreateOrganizationUseCase(
      transactionPort as never,
      organizationsRepository as never,
      membership as never,
      accessControl as never,
      activityEmitter as never,
      tenantContextService,
    ),
  };
}

describe("CreateOrganizationUseCase", () => {
  it("records the activity while the caller has an active organization", async () => {
    const harness = buildHarness();

    const created = await harness.tenantContextService.runAsync(CALLER_CONTEXT, () =>
      harness.useCase.execute(actor, { name: "Second Org" }),
    );

    expect(created.id).toBe("org-created");
    expect(harness.activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-created", actorId: "u1" }),
      "tx",
    );
    // The emit must not run under the caller's organization scope: the activity
    // names a *new* organization, so an ambient non-platform tenant would make
    // EmitActivityUseCase throw AUTH_FORBIDDEN instead of writing the row.
    expect(harness.contextAtEmit()).toEqual({ tenantId: "", userId: "", bypassRls: true });
  });

  it("restores the caller's tenant context once the activity is written", async () => {
    const harness = buildHarness();

    await harness.tenantContextService.runAsync(CALLER_CONTEXT, async () => {
      await harness.useCase.execute(actor, { name: "Second Org" });
      expect(getTenantContext()).toEqual(CALLER_CONTEXT);
    });
  });

  it("keeps membership, access-control and activity on the same transaction", async () => {
    const harness = buildHarness();

    await harness.tenantContextService.runAsync(CALLER_CONTEXT, () =>
      harness.useCase.execute(actor, { name: "Second Org" }),
    );

    expect(harness.membership.addMember).toHaveBeenCalledWith(
      { organizationId: "org-created", userId: "u1", role: "OWNER" },
      "tx",
    );
    expect(harness.accessControl.ensureOrganizationAdminRole).toHaveBeenCalledWith(
      "org-created",
      "u1",
      "tx",
    );
    expect(harness.activityEmitter.emit).toHaveBeenCalledWith(expect.anything(), "tx");
  });
});
