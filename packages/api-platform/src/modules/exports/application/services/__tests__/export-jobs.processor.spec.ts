import { describe, expect, it, vi } from "vitest";

import { ExportJobsProcessor } from "../export-jobs.processor";

const buildJob = (overrides: Record<string, unknown> = {}) => ({
  id: "export-1",
  type: "users",
  status: "PROCESSING",
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

function createProcessor(overrides?: Record<string, unknown>) {
  const exportJobsRepository = {
    claimPending: vi.fn(async () => [buildJob()]),
    findById: vi.fn(async () => buildJob()),
    update: vi.fn(async (_id, data) => buildJob(data)),
    ...((overrides?.exportJobsRepository as Record<string, unknown>) ?? {}),
  };

  const adapter = {
    type: "users",
    csvHeader: ["email", "displayName"],
    listForExport: vi.fn(async () => [
      { email: "a@b.com", displayName: "A" },
      { email: "c@d.com", displayName: "C" },
    ]),
    toCsvRow: vi.fn((row: Record<string, string>) => [row.email, row.displayName]),
    ...((overrides?.adapter as Record<string, unknown>) ?? {}),
  };

  const importExportAdapters = {
    resolve: vi.fn(() => adapter),
    ...((overrides?.importExportAdapters as Record<string, unknown>) ?? {}),
  };

  const filesRepository = {
    create: vi.fn(async (values: Record<string, unknown>) => ({
      id: "file-export-1",
      ...values,
    })),
    ...((overrides?.filesRepository as Record<string, unknown>) ?? {}),
  };

  const objectStorage = {
    upload: vi.fn(async () => ({ key: "exports/key.csv" })),
    delete: vi.fn(async () => undefined),
    ...((overrides?.objectStorage as Record<string, unknown>) ?? {}),
  };

  const auditService = {
    log: vi.fn(async () => undefined),
    ...((overrides?.auditService as Record<string, unknown>) ?? {}),
  };

  const transactionPort = {
    run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
    ...((overrides?.transactionPort as Record<string, unknown>) ?? {}),
  };

  const activityEmitter = {
    emit: vi.fn(async () => undefined),
    ...((overrides?.activityEmitter as Record<string, unknown>) ?? {}),
  };

  const tenantContextService = {
    runAsync: vi.fn(async (_ctx: unknown, cb: () => Promise<unknown>): Promise<unknown> => cb()),
    ...((overrides?.tenantContextService as Record<string, unknown>) ?? {}),
  };

  const logger = {
    warn: vi.fn(),
    error: vi.fn(),
    ...((overrides?.logger as Record<string, unknown>) ?? {}),
  };

  const errorReporter = {
    reportException: vi.fn(),
    reportMessage: vi.fn(),
    ...((overrides?.errorReporter as Record<string, unknown>) ?? {}),
  };

  const processor = new ExportJobsProcessor(
    exportJobsRepository as never,
    importExportAdapters as never,
    filesRepository as never,
    objectStorage as never,
    auditService as never,
    transactionPort as never,
    activityEmitter as never,
    tenantContextService as never,
    logger as never,
    errorReporter as never,
  );

  return {
    processor,
    exportJobsRepository,
    adapter,
    importExportAdapters,
    filesRepository,
    objectStorage,
    auditService,
    transactionPort,
    activityEmitter,
    tenantContextService,
    logger,
    errorReporter,
  };
}

describe("ExportJobsProcessor", () => {
  it("claims pending jobs and completes them under the tenant context", async () => {
    const {
      processor,
      exportJobsRepository,
      adapter,
      filesRepository,
      auditService,
      activityEmitter,
      tenantContextService,
    } = createProcessor();

    await processor.processPendingExports();

    expect(exportJobsRepository.claimPending).toHaveBeenCalledWith(10);

    expect(tenantContextService.runAsync).toHaveBeenCalledWith(
      { tenantId: "org-1", userId: "user-1" },
      expect.any(Function),
    );

    expect(adapter.listForExport).toHaveBeenCalledWith({
      organizationId: "org-1",
      ownerId: "user-1",
      limit: 50001,
    });

    expect(filesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        mimeType: "text/csv",
        uploadedById: "user-1",
      }),
      expect.anything(),
    );

    expect(exportJobsRepository.update).toHaveBeenCalledWith(
      "export-1",
      expect.objectContaining({ status: "COMPLETED", fileId: "file-export-1" }),
      expect.anything(),
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "export.completed",
        entityId: "export-1",
        metadata: expect.objectContaining({ rowCount: 2 }),
      }),
      expect.anything(),
    );

    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        summary: 'Export "users" completed (2 rows)',
        entityId: "export-1",
      }),
      expect.anything(),
    );
  });

  it("marks the job FAILED and cleans up storage when processing fails", async () => {
    const { processor, exportJobsRepository, objectStorage } = createProcessor({
      adapter: {
        type: "users",
        csvHeader: ["email"],
        listForExport: vi.fn(async () => {
          throw new Error("Export failed");
        }),
        toCsvRow: vi.fn(),
      },
      importExportAdapters: {
        resolve: vi.fn(() => ({
          type: "users",
          csvHeader: ["email"],
          listForExport: vi.fn(async () => {
            throw new Error("Export failed");
          }),
          toCsvRow: vi.fn(),
        })),
      },
    });

    await processor.processPendingExports();

    expect(exportJobsRepository.update).toHaveBeenCalledWith(
      "export-1",
      expect.objectContaining({ status: "FAILED" }),
    );
    // Storage delete was attempted for the uploaded object (none in this case).
    expect(objectStorage.upload).not.toHaveBeenCalled();
  });

  it("cleans up the uploaded blob when the completion transaction fails", async () => {
    const { processor, exportJobsRepository, objectStorage, filesRepository } = createProcessor({
      filesRepository: {
        create: vi.fn(async () => {
          throw new Error("File insert failed");
        }),
      },
    });

    await processor.processPendingExports();

    expect(objectStorage.delete).toHaveBeenCalledWith(expect.stringMatching(/^exports\/user-1\//));
    expect(exportJobsRepository.update).toHaveBeenCalledWith(
      "export-1",
      expect.objectContaining({ status: "FAILED" }),
    );
  });

  it("fails the job when the row cap is exceeded", async () => {
    const { processor, exportJobsRepository, objectStorage } = createProcessor({
      adapter: {
        type: "users",
        csvHeader: ["email"],
        listForExport: vi.fn(async () =>
          Array.from({ length: 50001 }, (_, i) => ({ email: `u${i}@x.com` })),
        ),
        toCsvRow: vi.fn((row: { email: string }) => [row.email]),
      },
      importExportAdapters: {
        resolve: vi.fn(() => ({
          type: "users",
          csvHeader: ["email"],
          listForExport: vi.fn(async () =>
            Array.from({ length: 50001 }, (_, i) => ({ email: `u${i}@x.com` })),
          ),
          toCsvRow: vi.fn((row: { email: string }) => [row.email]),
        })),
      },
    });

    await processor.processPendingExports();

    expect(objectStorage.upload).not.toHaveBeenCalled();
    expect(exportJobsRepository.update).toHaveBeenCalledWith(
      "export-1",
      expect.objectContaining({ status: "FAILED" }),
    );
  });

  it("skips jobs that are no longer PROCESSING (already recovered)", async () => {
    const { processor, exportJobsRepository, filesRepository } = createProcessor({
      exportJobsRepository: {
        claimPending: vi.fn(async () => [buildJob()]),
        findById: vi.fn(async () => buildJob({ status: "FAILED" })),
        update: vi.fn(),
      },
    });

    await processor.processPendingExports();

    expect(filesRepository.create).not.toHaveBeenCalled();
    expect(exportJobsRepository.update).not.toHaveBeenCalled();
  });

  it("does not re-enter while a previous tick is still running", async () => {
    const { processor, exportJobsRepository } = createProcessor({
      exportJobsRepository: {
        claimPending: vi.fn(
          () => new Promise((resolve) => setTimeout(() => resolve([buildJob()]), 5)),
        ),
        findById: vi.fn(async () => buildJob()),
        update: vi.fn(async () => buildJob()),
      },
    });

    // First call starts and blocks on claimPending.
    const first = processor.processPendingExports();
    // Second call is skipped (processing flag is set).
    await processor.processPendingExports();
    await first;

    expect(exportJobsRepository.claimPending).toHaveBeenCalledTimes(1);
  });
});
