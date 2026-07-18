import { describe, expect, it, vi } from 'vitest';

import { PurgeExpiredAuditLogsUseCase } from './purge-expired-audit-logs.use-case';

const buildEnvironmentService = (retentionDays: number) => ({
  values: { AUDIT_RETENTION_DAYS: retentionDays },
});

describe('PurgeExpiredAuditLogsUseCase', () => {
  it('no-ops when retention is disabled', async () => {
    const auditRepository = { tryAdvisoryLock: vi.fn(), deleteOlderThanBatched: vi.fn(), unlockAdvisoryLock: vi.fn() };
    const recordAuditLogUseCase = { execute: vi.fn() };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(0) as never,
      {} as never,
    );

    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(auditRepository.deleteOlderThanBatched).not.toHaveBeenCalled();
    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
  });

  it('deletes rows older than the retention cutoff and records the purge', async () => {
    const auditRepository = {
      deleteOlderThanBatched: vi.fn(async () => 3),
    };
    const recordAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    
    const clientMock = {
      query: vi.fn(async (sql) => {
        if (sql.includes('pg_try_advisory_lock')) return { rows: [{ acquired: true }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const poolMock = {
      connect: vi.fn(async () => clientMock),
    };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(30) as never,
      poolMock as never,
    );

    const result = await useCase.execute();

    expect(poolMock.connect).toHaveBeenCalled();
    expect(clientMock.query).toHaveBeenCalledWith('SELECT pg_try_advisory_lock($1) AS acquired', [42001]);
    expect(auditRepository.deleteOlderThanBatched).toHaveBeenCalledWith(
      expect.any(Date),
      5000,
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
    const auditRepository = {
      deleteOlderThanBatched: vi.fn(async () => 0),
    };
    const recordAuditLogUseCase = { execute: vi.fn(async () => undefined) };

    const clientMock = {
      query: vi.fn(async (sql) => {
        if (sql.includes('pg_try_advisory_lock')) return { rows: [{ acquired: true }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const poolMock = {
      connect: vi.fn(async () => clientMock),
    };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(30) as never,
      poolMock as never,
    );

    const result = await useCase.execute();

    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
    expect(result).toMatchObject({ deletedCount: 0 });
  });

  it('skips purge when advisory lock is already held by another replica', async () => {
    const auditRepository = {
      deleteOlderThanBatched: vi.fn(),
    };
    const recordAuditLogUseCase = { execute: vi.fn() };

    const clientMock = {
      query: vi.fn(async (sql) => {
        if (sql.includes('pg_try_advisory_lock')) return { rows: [{ acquired: false }] };
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    const poolMock = {
      connect: vi.fn(async () => clientMock),
    };

    const useCase = new PurgeExpiredAuditLogsUseCase(
      auditRepository as never,
      recordAuditLogUseCase as never,
      buildEnvironmentService(30) as never,
      poolMock as never,
    );

    const result = await useCase.execute();

    expect(result).toBeNull();
    expect(clientMock.release).toHaveBeenCalled();
    expect(auditRepository.deleteOlderThanBatched).not.toHaveBeenCalled();
    expect(recordAuditLogUseCase.execute).not.toHaveBeenCalled();
  });
});
