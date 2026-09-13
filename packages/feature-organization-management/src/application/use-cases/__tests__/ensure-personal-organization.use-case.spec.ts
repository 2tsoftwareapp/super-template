import { beforeEach, describe, expect, it, vi } from "vitest";

import { EnsurePersonalOrganizationUseCase } from "../ensure-personal-organization.use-case";

function buildMocks() {
  return {
    core: {
      execute: vi.fn().mockResolvedValue("org-123"),
    },
    accessControl: {
      ensureOrganizationAdminRole: vi.fn().mockResolvedValue(undefined),
    },
  };
}

function buildUseCase(
  m: ReturnType<typeof buildMocks>,
  organizationModel: "personal-orgs" | "org-optional" = "personal-orgs",
) {
  return new EnsurePersonalOrganizationUseCase(
    m.core as never,
    m.accessControl as never,
    { organizationModel } as never,
  );
}

describe("EnsurePersonalOrganizationUseCase (RBAC-aware)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates organization via core then assigns admin role", async () => {
    const m = buildMocks();
    const useCase = buildUseCase(m);

    const orgId = await useCase.ensurePersonalOrganization("user-1", "Alice", "tx-exec" as never);

    expect(orgId).toBe("org-123");

    // Core use case was called first with correct args.
    expect(m.core.execute).toHaveBeenCalledOnce();
    expect(m.core.execute).toHaveBeenCalledWith("user-1", "Alice", "tx-exec");

    // Access control was called AFTER organization creation, with the returned org ID.
    expect(m.accessControl.ensureOrganizationAdminRole).toHaveBeenCalledOnce();
    expect(m.accessControl.ensureOrganizationAdminRole).toHaveBeenCalledWith(
      "org-123",
      "user-1",
      "tx-exec",
    );

    // Core was called before access control.
    expect(m.core.execute.mock.invocationCallOrder[0]).toBeLessThan(
      m.accessControl.ensureOrganizationAdminRole.mock.invocationCallOrder[0],
    );
  });

  it("propagates the same transaction executor to both calls", async () => {
    const m = buildMocks();
    const useCase = buildUseCase(m);
    const executor = { id: "shared-tx" } as never;

    await useCase.ensurePersonalOrganization("user-1", "Alice", executor);

    expect(m.core.execute).toHaveBeenCalledWith("user-1", "Alice", executor);
    expect(m.accessControl.ensureOrganizationAdminRole).toHaveBeenCalledWith(
      "org-123",
      "user-1",
      executor,
    );
  });

  it("works without explicit executor (optional)", async () => {
    const m = buildMocks();
    const useCase = buildUseCase(m);

    const orgId = await useCase.ensurePersonalOrganization("user-1", "Alice");

    expect(orgId).toBe("org-123");
    expect(m.core.execute).toHaveBeenCalledWith("user-1", "Alice", undefined);
    expect(m.accessControl.ensureOrganizationAdminRole).toHaveBeenCalledWith(
      "org-123",
      "user-1",
      undefined,
    );
  });

  it("does NOT call ensureOrganizationAdminRole if core throws", async () => {
    const m = buildMocks();
    m.core.execute.mockRejectedValueOnce(new Error("org creation failed"));
    const useCase = buildUseCase(m);

    await expect(
      useCase.ensurePersonalOrganization("user-1", "Alice", "tx-exec" as never),
    ).rejects.toThrow("org creation failed");

    expect(m.core.execute).toHaveBeenCalledOnce();
    expect(m.accessControl.ensureOrganizationAdminRole).not.toHaveBeenCalled();
  });

  it("returns the organization ID from the core use case", async () => {
    const m = buildMocks();
    m.core.execute.mockResolvedValueOnce("org-456");
    const useCase = buildUseCase(m);

    const orgId = await useCase.ensurePersonalOrganization("user-2", "Bob");

    expect(orgId).toBe("org-456");
    expect(m.accessControl.ensureOrganizationAdminRole).toHaveBeenCalledWith(
      "org-456",
      "user-2",
      undefined,
    );
  });

  it("propagates access-control failure to caller", async () => {
    const m = buildMocks();
    m.accessControl.ensureOrganizationAdminRole.mockRejectedValueOnce(
      new Error("RBAC assignment failed"),
    );
    const useCase = buildUseCase(m);

    await expect(
      useCase.ensurePersonalOrganization("user-1", "Alice", "tx-exec" as never),
    ).rejects.toThrow("RBAC assignment failed");

    // Core was still called (and organization was created).
    expect(m.core.execute).toHaveBeenCalledOnce();
  });

  it("is a no-op returning null in the org-optional model", async () => {
    const m = buildMocks();
    const useCase = buildUseCase(m, "org-optional");

    const orgId = await useCase.ensurePersonalOrganization("user-1", "Alice", "tx-exec" as never);

    expect(orgId).toBeNull();
    expect(m.core.execute).not.toHaveBeenCalled();
    expect(m.accessControl.ensureOrganizationAdminRole).not.toHaveBeenCalled();
  });
});
