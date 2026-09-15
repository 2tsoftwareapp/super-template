import { describe, expect, it, vi } from "vitest";

import { AppError, PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { FILE_VISIBILITY } from "@repo/feature-upload/contracts";

import { ExportAuditLogsUseCase } from "../export-audit-logs.use-case";
import { AUDIT_EXPORT_FILE_KIND } from "../../domain/audit-export-access.policy";

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

const auditRow = {
  id: "log-1",
  organizationId: "org-1",
  actorId: "user-2",
  action: "project.created",
  entityType: "project",
  entityId: "project-1",
  metadata: { name: "Demo" },
  ipAddress: "127.0.0.1",
  requestId: "req-1",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("ExportAuditLogsUseCase", () => {
  it("exports matching rows to CSV, uploads them, and records the export", async () => {
    const auditRepository = {
      listForExport: vi.fn(async () => [auditRow]),
      count: vi.fn(async () => 1),
    };
    const filesRepository = {
      create: vi.fn(async () => ({ id: "file-1" })),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: "exports/audit/some-key.csv" })),
      delete: vi.fn(async () => undefined),
    };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const storageTracking = { enqueueDelete: vi.fn(async () => undefined) };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      platformTransactionPort as never,
      auditWriter as never,
      storageTracking as never,
      logger as never,
    );

    const result = await useCase.execute(actor, { action: "project.created" });

    expect(auditRepository.listForExport).toHaveBeenCalledWith(
      {
        action: "project.created",
        limit: 5000,
        organizationId: "org-1",
      },
      expect.anything(),
    );
    expect(auditRepository.count).toHaveBeenCalledWith(
      {
        action: "project.created",
        organizationId: "org-1",
      },
      expect.anything(),
    );
    expect(objectStorage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: "text/csv" }),
    );
    expect(filesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        uploadedById: "user-1",
        mimeType: "text/csv",
        kind: AUDIT_EXPORT_FILE_KIND,
        visibility: FILE_VISIBILITY.RESTRICTED,
      }),
      expect.anything(),
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "audit.exported",
        actorId: "user-1",
        organizationId: "org-1",
        metadata: expect.objectContaining({ rowCount: 1, fileId: "file-1" }),
      }),
      expect.anything(),
    );
    expect(result).toEqual({ fileId: "file-1", rowCount: 1, totalMatching: 1, truncated: false });
  });

  it("rejects when the actor has no active organization", async () => {
    const auditRepository = { listForExport: vi.fn(), count: vi.fn() };
    const filesRepository = { create: vi.fn() };
    const objectStorage = { upload: vi.fn(), delete: vi.fn() };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };
    const auditWriter = { log: vi.fn() };
    const storageTracking = { enqueueDelete: vi.fn(async () => undefined) };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      platformTransactionPort as never,
      auditWriter as never,
      storageTracking as never,
      logger as never,
    );

    await expect(useCase.execute({ ...actor, organizationId: null }, {})).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_FORBIDDEN,
    });

    expect(auditRepository.listForExport).not.toHaveBeenCalled();
  });

  it("allows SUPER_ADMIN to export globally without organizationId", async () => {
    const auditRepository = {
      listForExport: vi.fn(async () => [auditRow]),
      count: vi.fn(async () => 1),
    };
    const filesRepository = {
      create: vi.fn(async () => ({ id: "file-1" })),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: "exports/audit/global.csv" })),
      delete: vi.fn(async () => undefined),
    };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };
    const auditWriter = { log: vi.fn() };
    const storageTracking = { enqueueDelete: vi.fn(async () => undefined) };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      platformTransactionPort as never,
      auditWriter as never,
      storageTracking as never,
      logger as never,
    );

    const superAdminActor = {
      ...actor,
      organizationId: null,
      roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN],
    };
    await useCase.execute(superAdminActor, {});

    expect(auditRepository.listForExport).toHaveBeenCalledWith({ limit: 5000 }, expect.anything());
    expect(filesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: null,
        uploadedById: "user-1",
        kind: AUDIT_EXPORT_FILE_KIND,
        visibility: FILE_VISIBILITY.RESTRICTED,
      }),
      expect.anything(),
    );
  });

  it("propagates the q filter to listForExport and count", async () => {
    const auditRepository = {
      listForExport: vi.fn(async () => [auditRow]),
      count: vi.fn(async () => 1),
    };
    const filesRepository = {
      create: vi.fn(async () => ({ id: "file-1" })),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: "exports/audit/q.csv" })),
      delete: vi.fn(async () => undefined),
    };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };
    const auditWriter = { log: vi.fn() };
    const storageTracking = { enqueueDelete: vi.fn(async () => undefined) };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      platformTransactionPort as never,
      auditWriter as never,
      storageTracking as never,
      logger as never,
    );

    await useCase.execute(actor, { q: "project" });

    expect(auditRepository.listForExport).toHaveBeenCalledWith(
      { q: "project", limit: 5000, organizationId: "org-1" },
      expect.anything(),
    );
    expect(auditRepository.count).toHaveBeenCalledWith(
      { q: "project", organizationId: "org-1" },
      expect.anything(),
    );
  });

  it("deletes the uploaded object and rethrows if the file record fails to persist", async () => {
    const auditRepository = {
      listForExport: vi.fn(async () => [auditRow]),
      count: vi.fn(async () => 1),
    };
    const filesRepository = {
      create: vi.fn(async () => {
        throw new Error("insert failed");
      }),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: "exports/audit/some-key.csv" })),
      delete: vi.fn(async () => undefined),
    };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const storageTracking = { enqueueDelete: vi.fn(async () => undefined) };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      platformTransactionPort as never,
      auditWriter as never,
      storageTracking as never,
      logger as never,
    );

    await expect(useCase.execute(actor, {})).rejects.toThrow("insert failed");

    expect(objectStorage.delete).toHaveBeenCalledWith(expect.stringContaining("exports/audit/"));
    // The delete succeeded, so no outbox retry is needed.
    expect(storageTracking.enqueueDelete).not.toHaveBeenCalled();
    expect(auditWriter.log).not.toHaveBeenCalled();
  });

  it("records a delete retry in the outbox when the compensation delete also fails", async () => {
    const auditRepository = {
      listForExport: vi.fn(async () => [auditRow]),
      count: vi.fn(async () => 1),
    };
    const filesRepository = {
      create: vi.fn(async () => {
        throw new Error("insert failed");
      }),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: "exports/audit/some-key.csv" })),
      delete: vi.fn(async () => {
        throw new Error("storage unavailable");
      }),
    };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const storageTracking = { enqueueDelete: vi.fn(async () => undefined) };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      platformTransactionPort as never,
      auditWriter as never,
      storageTracking as never,
      logger as never,
    );

    await expect(useCase.execute(actor, {})).rejects.toThrow("insert failed");

    // Compensation attempted, failed loudly, and the object is recorded for the
    // cleanup worker instead of being stranded silently.
    expect(objectStorage.delete).toHaveBeenCalledWith(expect.stringContaining("exports/audit/"));
    expect(storageTracking.enqueueDelete).toHaveBeenCalledWith(
      expect.stringContaining("exports/audit/"),
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("orphaned audit-export object"),
      expect.objectContaining({ error: "storage unavailable" }),
    );
    expect(auditWriter.log).not.toHaveBeenCalled();
  });

  it("still rethrows the original error when recording the delete retry fails too", async () => {
    const auditRepository = {
      listForExport: vi.fn(async () => [auditRow]),
      count: vi.fn(async () => 1),
    };
    const filesRepository = {
      create: vi.fn(async () => {
        throw new Error("insert failed");
      }),
    };
    const objectStorage = {
      upload: vi.fn(async () => ({ key: "exports/audit/some-key.csv" })),
      delete: vi.fn(async () => {
        throw new Error("storage unavailable");
      }),
    };
    const transactionPort = { withTenant: vi.fn(async (_, cb) => cb({} as any)) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const storageTracking = {
      enqueueDelete: vi.fn(async () => {
        throw new Error("outbox write failed");
      }),
    };
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const useCase = new ExportAuditLogsUseCase(
      auditRepository as never,
      filesRepository as never,
      objectStorage as never,
      transactionPort as never,
      platformTransactionPort as never,
      auditWriter as never,
      storageTracking as never,
      logger as never,
    );

    await expect(useCase.execute(actor, {})).rejects.toThrow("insert failed");

    expect(storageTracking.enqueueDelete).toHaveBeenCalled();
    // Both failures are visible in the logs — never silent.
    expect(logger.error).toHaveBeenCalledTimes(2);
  });
});
