import { describe, expect, it, vi } from 'vitest';

import { PurgeExpiredAuditLogsUseCase } from './purge-expired-audit-logs.use-case';

const buildEnvironmentService = (retentionDays: number) => ({
  values: { AUDIT_RETENTION_DAYS: retentionDays },
});

describe('PurgeExpiredAuditLogsUseCase', () => {
  it('no-ops when retention is disabled', async () => {
    const auditRepository = { deleteOlderThan: vi.fn() };
    const recordAuditLogUseCase = { execute: vi.fn() };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(0) as never,
    );

    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(auditRepository.deleteOlderThan).not.toHaveBeenCalled();
    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
  });

  it('deletes rows older than the retention cutoff and records the purge', async () => {
    const auditRepository = { deleteOlderThan: vi.fn(async () => 3) };
    const recordAuditLogUseCase = { execute: vi.fn(async () => undefined) };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(30) as never,
    );

    const result = await useCase.execute();

    expect(auditRepository.deleteOlderThan).toHaveBeenCalledWith(
      expect.any(Date),
    );
    expect(recordAuditLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'audit.retention_purged',
        entityType: 'audit_log',
        metadata: expect.objectContaining({ deletedCount: 3, retentionDays: 30 }),
      }),
    );
    expect(result).toMatchObject({ deletedCount: 3 });
  });

  it('does not record a purge entry when nothing was deleted', async () => {
    const auditRepository = { deleteOlderThan: vi.fn(async () => 0) };
    const recordAuditLogUseCase = { execute: vi.fn(async () => undefined) };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(30) as never,
    );

    const result = await useCase.execute();

    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
    expect(result).toMatchObject({ deletedCount: 0 });
  });
});
