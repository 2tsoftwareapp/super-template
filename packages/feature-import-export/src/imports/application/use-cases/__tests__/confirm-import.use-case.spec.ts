import { describe, expect, it, vi } from "vitest";

import { CsvFormatError } from "../../../domain/csv";
import { ConfirmImportUseCase } from "../confirm-import.use-case";

const actor = {
  userId: "user-1",
  sessionId: "session-1",
  email: "admin@example.local",
  displayName: "Admin",
  status: "ACTIVE" as const,
  roles: ["ADMIN"],
  permissions: [],
  organizationId: "org-1",
};

const VALIDATED_HASH = "sha256-recorded-at-validation";

function createImportJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    createdById: "user-1",
    type: "users",
    fileId: "file-1",
    organizationId: "org-1",
    status: "PENDING",
    confirmedAt: null,
    completedAt: null,
    rowCount: null,
    successCount: null,
    errorCount: null,
    errors: null,
    // SHA-256 recorded when the file was validated at create time.
    contentHash: VALIDATED_HASH,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const parsedData = {
  rows: [{ name: "Row 1" }, { name: "Row 2 Error" }, { name: "Row 3" }],
  contentHash: VALIDATED_HASH,
};

describe("ConfirmImportUseCase", () => {
  it("imports rows using savepoints and continues on row failure", async () => {
    const importJob = createImportJob();

    const file = {
      id: "file-1",
      organizationId: "org-1",
      storageKey: "imports/file.csv",
    };

    const importJobsRepository = {
      findById: vi.fn(async () => importJob),
      confirm: vi.fn(async () => importJob),
      update: vi.fn(async (_id, data) => ({ ...importJob, ...data })),
    };

    const fileAccessService = {
      findAccessibleFile: vi.fn(async () => file),
    };

    const adapter = {
      importRow: vi.fn(async (row: { name: string }) => {
        if (row.name === "Row 2 Error") {
          throw new Error("Constraint violation");
        }
      }),
    };

    const importExportAdapters = {
      resolve: vi.fn(() => adapter),
      getImportPermissions: vi.fn(() => []),
    };

    const importFileParser = {
      parseImportFile: vi.fn(async () => parsedData),
    };

    const auditService = {
      log: vi.fn(async () => undefined),
    };

    const importsMapper = {
      toImportJobView: vi.fn((job: Record<string, unknown>) => ({
        id: String(job.id),
        type: String(job.type),
        fileId: String(job.fileId),
        status: String(job.status),
        rowCount: (job.rowCount as number | null) ?? null,
        successCount: (job.successCount as number | null) ?? null,
        errorCount: (job.errorCount as number | null) ?? null,
        errors: (job.errors as unknown[] | null) ?? null,
        createdById: String(job.createdById),
        confirmedAt: job.confirmedAt instanceof Date ? job.confirmedAt.toISOString() : null,
        completedAt: job.completedAt instanceof Date ? job.completedAt.toISOString() : null,
        createdAt:
          job.createdAt instanceof Date ? job.createdAt.toISOString() : new Date().toISOString(),
        updatedAt:
          job.updatedAt instanceof Date ? job.updatedAt.toISOString() : new Date().toISOString(),
      })),
    };

    const transactionPort = {
      run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
      withSavepoint: vi.fn(async (_tx: unknown, _name: string, cb: () => Promise<unknown>) => cb()),
    };

    const activityEmitter = {
      emit: vi.fn(async () => undefined),
    };

    const useCase = new ConfirmImportUseCase(
      importJobsRepository as never,
      fileAccessService as never,
      importExportAdapters as never,
      importFileParser as never,
      auditService as never,
      importsMapper as never,
      transactionPort as never,
      activityEmitter as never,
    );

    const result = await useCase.execute(actor, "job-1");

    expect(importJobsRepository.findById).toHaveBeenCalledWith("job-1");
    expect(importJobsRepository.confirm).toHaveBeenCalledWith("job-1", expect.anything());
    expect(fileAccessService.findAccessibleFile).toHaveBeenCalledWith(actor, "file-1");
    expect(importFileParser.parseImportFile).toHaveBeenCalledWith("users", "imports/file.csv");

    expect(adapter.importRow).toHaveBeenCalledTimes(3);
    expect(transactionPort.withSavepoint).toHaveBeenCalledTimes(3);

    expect(importJobsRepository.update).toHaveBeenCalledWith(
      "job-1",
      expect.objectContaining({
        status: "FAILED",
        successCount: 2,
        errorCount: 1,
        errors: [{ row: 2, message: "Constraint violation" }],
      }),
      expect.anything(),
    );

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "import.confirmed",
        metadata: { successCount: 2, errorCount: 1 },
      }),
      expect.anything(),
    );

    expect(activityEmitter.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        summary: expect.stringContaining('Import "users" confirmed'),
        entityType: "import_job",
        entityId: "job-1",
        actorId: "user-1",
        metadata: { successCount: 2, errorCount: 1 },
      }),
      expect.anything(),
    );

    expect(result.status).toBe("FAILED");
    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(1);
  });

  describe("content integrity between validate and confirm", () => {
    function createIntegrityUseCase(overrides: {
      job?: Record<string, unknown>;
      parseImportFile?: ReturnType<typeof vi.fn>;
    }) {
      const importJob = createImportJob(overrides.job);
      const adapter = { importRow: vi.fn() };
      const importJobsRepository = {
        findById: vi.fn(async () => importJob),
        confirm: vi.fn(async () => importJob),
        update: vi.fn(),
      };
      const transactionPort = {
        run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
        withSavepoint: vi.fn(async (_tx: unknown, _name: string, cb: () => Promise<unknown>) =>
          cb(),
        ),
      };
      const importFileParser = {
        parseImportFile:
          overrides.parseImportFile ?? vi.fn(async () => ({ rows: [], contentHash: "matches" })),
      };
      const importsMapper = {
        toImportJobView: vi.fn((job: Record<string, unknown>) => ({ id: String(job.id) })),
      };

      const useCase = new ConfirmImportUseCase(
        importJobsRepository as never,
        {
          findAccessibleFile: vi.fn(async () => ({
            id: "file-1",
            organizationId: "org-1",
            storageKey: "imports/file.csv",
          })),
        } as never,
        { resolve: vi.fn(() => adapter), getImportPermissions: vi.fn(() => []) } as never,
        importFileParser as never,
        { log: vi.fn() } as never,
        importsMapper as never,
        transactionPort as never,
        { emit: vi.fn() } as never,
      );

      return { adapter, importJobsRepository, useCase };
    }

    it("imports nothing when the stored file no longer matches the validated fingerprint", async () => {
      const { adapter, importJobsRepository, useCase } = createIntegrityUseCase({
        parseImportFile: vi.fn(async () => ({ rows: [{ name: "Row 1" }], contentHash: "swapped" })),
      });

      await expect(useCase.execute(actor, "job-1")).rejects.toMatchObject({
        code: "IMPORT_FILE_MODIFIED",
        statusCode: 409,
      });

      expect(adapter.importRow).not.toHaveBeenCalled();
      expect(importJobsRepository.confirm).not.toHaveBeenCalled();
      expect(importJobsRepository.update).not.toHaveBeenCalled();
    });

    it("refuses to import when the job recorded no fingerprint", async () => {
      const { adapter, useCase } = createIntegrityUseCase({
        job: { contentHash: null },
        parseImportFile: vi.fn(async () => ({ rows: [{ name: "Row 1" }], contentHash: "any" })),
      });

      await expect(useCase.execute(actor, "job-1")).rejects.toMatchObject({
        code: "IMPORT_FILE_MODIFIED",
      });
      expect(adapter.importRow).not.toHaveBeenCalled();
    });

    it("refuses to import when the stored file is no longer parseable CSV", async () => {
      const { adapter, importJobsRepository, useCase } = createIntegrityUseCase({
        parseImportFile: vi.fn(async () => {
          throw new CsvFormatError(2, "CSV record 2 has 4 field(s) but the header has 2");
        }),
      });

      await expect(useCase.execute(actor, "job-1")).rejects.toMatchObject({
        code: "IMPORT_FILE_MODIFIED",
      });
      expect(adapter.importRow).not.toHaveBeenCalled();
      expect(importJobsRepository.confirm).not.toHaveBeenCalled();
    });
  });

  it("aborts with a conflict when the job is confirmed concurrently", async () => {
    const importJob = createImportJob();

    const adapter = {
      importRow: vi.fn(),
    };

    const importJobsRepository = {
      findById: vi.fn(async () => importJob),
      // CAS claim fails: another request already confirmed the job.
      confirm: vi.fn(async () => null),
      update: vi.fn(),
    };

    const transactionPort = {
      run: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb({})),
      withSavepoint: vi.fn(async (_tx: unknown, _name: string, cb: () => Promise<unknown>) => cb()),
    };

    const useCase = new ConfirmImportUseCase(
      importJobsRepository as never,
      {
        findAccessibleFile: vi.fn(async () => ({
          id: "file-1",
          organizationId: "org-1",
          storageKey: "imports/file.csv",
        })),
      } as never,
      {
        resolve: vi.fn(() => adapter),
        getImportPermissions: vi.fn(() => []),
      } as never,
      {
        parseImportFile: vi.fn(async () => ({
          rows: [{ name: "Row 1" }],
          contentHash: VALIDATED_HASH,
        })),
      } as never,
      { log: vi.fn() } as never,
      {
        toImportJobView: vi.fn((job: Record<string, unknown>) => ({
          id: String(job.id),
          status: String(job.status),
        })),
      } as never,
      transactionPort as never,
      { emit: vi.fn() } as never,
    );

    await expect(useCase.execute(actor, "job-1")).rejects.toMatchObject({
      code: "RESOURCE_CONFLICT",
    });

    // No rows were imported and no final status was written.
    expect(adapter.importRow).not.toHaveBeenCalled();
    expect(importJobsRepository.update).not.toHaveBeenCalled();
  });
});
