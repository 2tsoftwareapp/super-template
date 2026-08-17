import { describe, expect, it, vi } from "vitest";

import { CreateExportUseCase } from "../create-export.use-case";

const createActor = (permissions: string[] = []) => ({
  userId: "user-1",
  sessionId: "session-1",
  email: "admin@example.local",
  displayName: "Admin",
  status: "ACTIVE" as const,
  roles: ["ADMIN"],
  permissions,
  organizationId: "org-1",
});

const buildJob = (overrides: Record<string, unknown> = {}) => ({
  id: "export-1",
  type: "users",
  status: "PENDING",
  filters: null,
  fileId: null,
  organizationId: "org-1",
  createdById: "user-1",
  idempotencyKey: null,
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

function createUseCase(overrides?: Record<string, unknown>) {
  const exportJobsRepository = {
    create: vi.fn(async (values: Record<string, unknown>) => buildJob(values)),
    createIdempotent: vi.fn(),
    update: vi.fn(),
    ...((overrides?.exportJobsRepository as Record<string, unknown>) ?? {}),
  };

  const importExportAdapters = {
    resolve: vi.fn(),
    getExportPermissions: vi.fn(() => []),
    ...((overrides?.importExportAdapters as Record<string, unknown>) ?? {}),
  };

  const auditService = {
    log: vi.fn(async () => undefined),
    ...((overrides?.auditService as Record<string, unknown>) ?? {}),
  };

  const transactionPort = {
    withTenant: vi.fn(async (_ctx: unknown, cb: (tx: unknown) => Promise<unknown>) => cb({})),
    run: vi.fn(),
    withSavepoint: vi.fn(),
    ...((overrides?.transactionPort as Record<string, unknown>) ?? {}),
  };

  const getExportUseCase = {
    execute: vi.fn(async () => buildJob({ id: "export-existing" })),
    ...((overrides?.getExportUseCase as Record<string, unknown>) ?? {}),
  };

  const useCase = new CreateExportUseCase(
    exportJobsRepository as never,
    importExportAdapters as never,
    auditService as never,
    transactionPort as never,
    getExportUseCase as never,
  );

  return {
    useCase,
    exportJobsRepository,
    importExportAdapters,
    auditService,
    transactionPort,
    getExportUseCase,
  };
}

describe("CreateExportUseCase", () => {
  it("enqueues a PENDING export job without doing any export work", async () => {
    const { useCase, exportJobsRepository, auditService, transactionPort } = createUseCase();

    const result = await useCase.execute(createActor(), { type: "users" });

    expect(transactionPort.withTenant).toHaveBeenCalledWith(
      { tenantId: "org-1", userId: "user-1" },
      expect.any(Function),
    );
    expect(exportJobsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "users",
        organizationId: "org-1",
        status: "PENDING",
        createdById: "user-1",
      }),
      expect.anything(),
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "export.created",
        entityType: "export_job",
        entityId: "export-1",
        metadata: { type: "users" },
      }),
      expect.anything(),
    );

    expect(result).toMatchObject({
      id: "export-1",
      status: "PENDING",
      fileId: null,
      completedAt: null,
    });
  });

  it("rejects when actor lacks required export permissions", async () => {
    const { useCase } = createUseCase({
      importExportAdapters: {
        resolve: vi.fn(),
        getExportPermissions: vi.fn(() => ["users.read"]),
      },
    });

    await expect(useCase.execute(createActor([]), { type: "users" })).rejects.toThrow(
      "Missing required permission: users.read",
    );
    expect(useCase).toBeDefined();
  });

  it("supports idempotency key by replaying the existing job", async () => {
    const { useCase, exportJobsRepository, auditService } = createUseCase({
      exportJobsRepository: {
        create: vi.fn(),
        createIdempotent: vi.fn(async () => ({
          value: buildJob({ id: "export-existing", status: "COMPLETED" }),
          created: false,
        })),
        update: vi.fn(),
      },
    });

    const result = await useCase.execute(createActor(), {
      type: "users",
      idempotencyKey: "idem-456",
    });

    expect(exportJobsRepository.createIdempotent).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: "idem-456" }),
      expect.anything(),
    );
    expect(exportJobsRepository.create).not.toHaveBeenCalled();
    // No duplicate audit on replay.
    expect(auditService.log).not.toHaveBeenCalled();
    expect(result).toMatchObject({ id: "export-existing" });
  });

  it("resolves the adapter up front so an unknown type fails fast", async () => {
    const { useCase, importExportAdapters } = createUseCase({
      importExportAdapters: {
        resolve: vi.fn(() => {
          throw new Error('Unsupported import/export type "unknown"');
        }),
        getExportPermissions: vi.fn(() => []),
      },
    });

    await expect(useCase.execute(createActor(), { type: "unknown" })).rejects.toThrow(
      'Unsupported import/export type "unknown"',
    );
    expect(importExportAdapters.resolve).toHaveBeenCalledWith("unknown");
  });
});
