import { describe, expect, it, vi } from "vitest";

import { PurgeExpiredAuditLogsUseCase } from "../purge-expired-audit-logs.use-case";

const buildEnvironmentService = (retentionDays: number) => ({
  values: { AUDIT_RETENTION_DAYS: retentionDays },
});

describe("PurgeExpiredAuditLogsUseCase", () => {
  it("no-ops when retention is disabled", async () => {
    const auditRepository = {
      deleteOlderThanBatched: vi.fn(),
    };
    const recordAuditLogUseCase = { execute: vi.fn() };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(0) as never,
      {} as never,
      {} as never,
    );

    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(auditRepository.deleteOlderThanBatched).not.toHaveBeenCalled();
    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
  });

  it("deletes rows older than the retention cutoff and records the purge", async () => {
    const auditRepository = {
      deleteOlderThanBatched: vi.fn().mockResolvedValueOnce(3).mockResolvedValue(0),
    };
    const recordAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    const advisoryLockPort = { withAdvisoryLock: vi.fn(async (_, cb) => cb()) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(30) as never,
      advisoryLockPort as never,
      platformTransactionPort as never,
    );

    const result = await useCase.execute();

    expect(result).toMatchObject({ deletedCount: 3 });
    // The purge runs inside the kernel advisory lock, so a second replica that
    // cannot take the lock never issues a delete.
    expect(advisoryLockPort.withAdvisoryLock).toHaveBeenCalledWith(42_001, expect.any(Function));
    expect(auditRepository.deleteOlderThanBatched).toHaveBeenCalledWith(
      expect.any(Date),
      5000,
      expect.anything(),
    );
    expect(recordAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "audit.retention_purged",
        entityType: "audit_log",
        metadata: expect.objectContaining({ deletedCount: 3, retentionDays: 30 }),
      }),
      expect.anything(),
    );
    expect(result).toMatchObject({ deletedCount: 3 });
  });

  it("does not record a purge entry when nothing was deleted", async () => {
    const auditRepository = {
      deleteOlderThanBatched: vi.fn(async () => 0),
    };
    const recordAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    const advisoryLockPort = { withAdvisoryLock: vi.fn(async (_, cb) => cb()) };
    const platformTransactionPort = { run: vi.fn(async (cb) => cb({} as any)) };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(30) as never,
      advisoryLockPort as never,
      platformTransactionPort as never,
    );

    const result = await useCase.execute();

    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
    expect(result).toMatchObject({ deletedCount: 0 });
  });

  it("skips purge when advisory lock is already held by another replica", async () => {
    const auditRepository = {
      deleteOlderThanBatched: vi.fn(),
    };
    const recordAuditLogUseCase = { execute: vi.fn() };
    const advisoryLockPort = { withAdvisoryLock: vi.fn(async () => null) };
    const platformTransactionPort = { run: vi.fn() };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(30) as never,
      advisoryLockPort as never,
      platformTransactionPort as never,
    );

    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(auditRepository.deleteOlderThanBatched).not.toHaveBeenCalled();
    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
  });
});
