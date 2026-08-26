import { describe, expect, it, vi } from "vitest";

import { CreateImportUseCase } from "../create-import.use-case";

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

function createUseCase(overrides?: Record<string, unknown>) {
  const file = {
    id: "file-1",
    organizationId: "org-1",
    storageKey: "imports/test.csv",
  };

  const fileAccessService = {
    findAccessibleFile: vi.fn(async () => file),
    ...((overrides?.fileAccessService as Record<string, unknown>) ?? {}),
  };

  const importFileParser = {
    parseImportFile: vi.fn(async () => ({
      headers: ["name"],
      rows: [{ name: "Row 1" }, { name: "Row 2" }],
      totalRows: 2,
    })),
    validateRows: vi.fn(() => []),
    ...((overrides?.importFileParser as Record<string, unknown>) ?? {}),
  };

  const parsedData = {
    headers: ["name"],
    rows: [{ name: "Row 1" }, { name: "Row 2" }],
    totalRows: 2,
  };

  const importJobsRepository = {
    create: vi.fn(async (values: Record<string, unknown>) => ({
      id: "job-1",
      ...values,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    createIdempotent: vi.fn(),
    update: vi.fn(async (id: string, _data: Record<string, unknown>) => ({
      id,
      status: "PROCESSING",
      rowCount: 2,
      successCount: 2,
      errorCount: 0,
      errors: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findById: vi.fn(async () => null),
    ...((overrides?.importJobsRepository as Record<string, unknown>) ?? {}),
  };

  const auditService = {
    log: vi.fn(async () => undefined),
    ...((overrides?.auditService as Record<string, unknown>) ?? {}),
  };

  const getImportUseCase = {
    execute: vi.fn(async (_actor: unknown, _jobId: string) => ({
      id: _jobId,
      type: "users",
      fileId: "file-1",
      status: "PROCESSING",
      rowCount: 2,
      successCount: 2,
      errorCount: 0,
      errors: null,
      createdById: "user-1",
      confirmedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    ...((overrides?.getImportUseCase as Record<string, unknown>) ?? {}),
  };

  const importExportAdapters = {
    resolve: vi.fn(),
    getImportPermissions: vi.fn(() => []),
    ...((overrides?.importExportAdapters as Record<string, unknown>) ?? {}),
  };

  const transactionPort = {
    withTenant: vi.fn(
      async (
        _ctx: unknown,
        cb: (tx: unknown) => Promise<{ job: Record<string, unknown>; created: boolean }>,
      ) => cb({}),
    ),
    run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
    ...((overrides?.transactionPort as Record<string, unknown>) ?? {}),
  };

  const useCase = new CreateImportUseCase(
    importJobsRepository as never,
    fileAccessService as never,
    importFileParser as never,
    auditService as never,
    getImportUseCase as never,
    transactionPort as never,
    importExportAdapters as never,
  );

  return {
    useCase,
    importJobsRepository,
    fileAccessService,
    importFileParser,
    parsedData,
    auditService,
    getImportUseCase,
    importExportAdapters,
    transactionPort,
  };
}

describe("CreateImportUseCase", () => {
  it("creates an import job and parses the file", async () => {
    const { useCase, importJobsRepository, fileAccessService, importFileParser, auditService } =
      createUseCase();

    const result = await useCase.execute(createActor(), {
      type: "users",
      fileId: "file-1",
    });

    expect(fileAccessService.findAccessibleFile).toHaveBeenCalledWith(createActor(), "file-1");
    expect(importJobsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "users",
        fileId: "file-1",
        organizationId: "org-1",
        status: "PENDING",
        createdById: "user-1",
      }),
      expect.anything(),
    );
    expect(importFileParser.parseImportFile).toHaveBeenCalledWith("users", "imports/test.csv");
    expect(importFileParser.validateRows).toHaveBeenCalledWith("users", [
      { name: "Row 1" },
      { name: "Row 2" },
    ]);
    expect(importJobsRepository.update).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({
        status: "PROCESSING",
        rowCount: 2,
        successCount: 2,
        errorCount: 0,
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "import.created",
        entityId: "job-1",
      }),
      expect.anything(),
    );
    expect(result.status).toBe("PROCESSING");
  });

  it("rejects when actor lacks required import permissions", async () => {
    const { useCase } = createUseCase({
      importExportAdapters: {
        resolve: vi.fn(),
        getImportPermissions: vi.fn(() => ["users.create"]),
      },
    });

    await expect(
      useCase.execute(createActor([]), { type: "users", fileId: "file-1" }),
    ).rejects.toThrow("Missing required permission: users.create");
  });

  it("allows when actor has required import permissions", async () => {
    const { useCase, importJobsRepository } = createUseCase({
      importExportAdapters: {
        resolve: vi.fn(),
        getImportPermissions: vi.fn(() => ["users.create"]),
      },
    });

    const actor = createActor(["users.create"]);
    const result = await useCase.execute(actor, {
      type: "users",
      fileId: "file-1",
    });

    expect(importJobsRepository.create).toHaveBeenCalled();
    expect(result.status).toBe("PROCESSING");
  });

  it("uses idempotency key when provided", async () => {
    const idempotentJob = {
      id: "job-existing",
      type: "users",
      fileId: "file-1",
      organizationId: "org-1",
      status: "PENDING" as const,
      createdById: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { useCase, importJobsRepository, getImportUseCase, importFileParser } = createUseCase({
      importJobsRepository: {
        create: vi.fn(),
        createIdempotent: vi.fn(async () => ({
          value: idempotentJob,
          created: true,
        })),
        update: vi.fn(),
        findById: vi.fn(async () => idempotentJob),
      },
    });

    await useCase.execute(createActor(), {
      type: "users",
      fileId: "file-1",
      idempotencyKey: "idem-123",
    });

    expect(importJobsRepository.createIdempotent).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "idem-123",
      }),
      expect.anything(),
    );
    expect(importFileParser.parseImportFile).toHaveBeenCalled();
  });

  it("rejects global files without organization", async () => {
    const { useCase } = createUseCase({
      fileAccessService: {
        findAccessibleFile: vi.fn(async () => ({
          id: "file-1",
          organizationId: null,
          storageKey: "imports/test.csv",
        })),
      },
    });

    await expect(
      useCase.execute(createActor(), { type: "users", fileId: "file-1" }),
    ).rejects.toThrow("Cannot import a global file");
  });
});
