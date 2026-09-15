import type { TenantContext } from "@repo/api-kernel";

import { TenantContextService } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import { EmitActivityUseCase, assertActivityOrganizationInTenant } from "../emit-activity.use-case";

const tenantContexts = new TenantContextService();

/** Run `operation` with the given tenant context active, like the HTTP interceptor does. */
const withTenant = <T>(context: TenantContext, operation: () => Promise<T>): Promise<T> =>
  tenantContexts.runAsync(context, operation);

describe("EmitActivityUseCase", () => {
  it("applies INTERNAL visibility and null defaults when omitted", async () => {
    const activitiesRepository = { create: vi.fn(async () => ({ id: "a-1" })) };
    const useCase = new EmitActivityUseCase(activitiesRepository as never);

    await useCase.execute({
      organizationId: "org-1",
      summary: "project.created",
      entityType: "project",
      entityId: "project-1",
    });

    expect(activitiesRepository.create).toHaveBeenCalledWith(
      {
        organizationId: "org-1",
        summary: "project.created",
        entityType: "project",
        entityId: "project-1",
        actorId: null,
        visibility: "INTERNAL",
        metadata: null,
      },
      undefined,
    );
  });

  it("forwards explicit fields and the transaction executor", async () => {
    const activitiesRepository = { create: vi.fn(async () => ({ id: "a-2" })) };
    const useCase = new EmitActivityUseCase(activitiesRepository as never);
    const executor = { tx: true };

    await useCase.execute(
      {
        organizationId: "org-1",
        summary: "project.updated",
        entityType: "project",
        entityId: "project-1",
        actorId: "user-1",
        visibility: "PUBLIC",
        metadata: { field: "name" },
      },
      executor as never,
    );

    expect(activitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        visibility: "PUBLIC",
        metadata: { field: "name" },
      }),
      executor,
    );
  });

  it("writes when the tenant-scoped actor targets its own organization", async () => {
    const activitiesRepository = { create: vi.fn(async () => ({ id: "a-3" })) };
    const useCase = new EmitActivityUseCase(activitiesRepository as never);

    await withTenant({ tenantId: "org-a", userId: "user-1" }, () =>
      useCase.execute({
        organizationId: "org-a",
        summary: "project.created",
        entityType: "project",
        entityId: "project-1",
      }),
    );

    expect(activitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-a" }),
      undefined,
    );
  });

  it("rejects a tenant-scoped actor targeting another organization", async () => {
    const activitiesRepository = { create: vi.fn(async () => ({ id: "a-4" })) };
    const useCase = new EmitActivityUseCase(activitiesRepository as never);

    await expect(
      withTenant({ tenantId: "org-a", userId: "user-1" }, () =>
        useCase.execute({
          organizationId: "org-b",
          summary: "project.created",
          entityType: "project",
          entityId: "project-1",
        }),
      ),
    ).rejects.toThrow(expect.objectContaining({ code: "AUTH_FORBIDDEN" }));

    expect(activitiesRepository.create).not.toHaveBeenCalled();
  });

  it("allows an RLS-bypassing platform/super actor to target any organization", async () => {
    const activitiesRepository = { create: vi.fn(async () => ({ id: "a-5" })) };
    const useCase = new EmitActivityUseCase(activitiesRepository as never);

    // A super admin that also carries an organization stays platform-scoped:
    // bypassing RLS is the signal, not the presence of a tenant id.
    await withTenant({ tenantId: "org-a", userId: "admin-1", bypassRls: true }, () =>
      useCase.execute({
        organizationId: "org-b",
        summary: "project.created",
        entityType: "project",
        entityId: "project-1",
      }),
    );

    expect(activitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-b" }),
      undefined,
    );
  });

  it("allows an organization-less platform actor to target an explicit organization", async () => {
    const activitiesRepository = { create: vi.fn(async () => ({ id: "a-6" })) };
    const useCase = new EmitActivityUseCase(activitiesRepository as never);

    await withTenant({ tenantId: "", userId: "admin-1", bypassRls: true }, () =>
      useCase.execute({
        organizationId: "org-b",
        summary: "organization.created",
        entityType: "organization",
        entityId: "org-b",
      }),
    );

    expect(activitiesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-b" }),
      undefined,
    );
  });
});

describe("assertActivityOrganizationInTenant", () => {
  it("is a no-op without a tenant context", () => {
    expect(() => assertActivityOrganizationInTenant("org-b", undefined)).not.toThrow();
  });

  it("is a no-op for an organization-less tenant context", () => {
    expect(() =>
      assertActivityOrganizationInTenant("org-b", { tenantId: "", userId: "user-1" }),
    ).not.toThrow();
  });

  it("throws for an org-scoped tenant context targeting another organization", () => {
    expect(() =>
      assertActivityOrganizationInTenant("org-b", { tenantId: "org-a", userId: "user-1" }),
    ).toThrow(expect.objectContaining({ code: "AUTH_FORBIDDEN" }));
  });
});
