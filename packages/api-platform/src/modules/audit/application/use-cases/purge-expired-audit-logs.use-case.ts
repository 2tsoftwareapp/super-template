import { Inject, Injectable } from '@nestjs/common';
import {  EnvironmentService , SYSTEM_SCOPE } from '@repo/api-core';

import { AUDIT_REPOSITORY, type AuditRepositoryPort } from '../ports/audit.repository.port';
import { RecordAuditLogUseCase } from './record-audit-log.use-case';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const PURGE_LOCK_ID = 42_001;
const BATCH_SIZE = 5000;

@Injectable()
export class PurgeExpiredAuditLogsUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepositoryPort,
    private readonly recordAuditLogUseCase: RecordAuditLogUseCase,
    private readonly environmentService: EnvironmentService,
  ) {}

  async execute(): Promise<{ deletedCount: number; cutoff: Date } | null> {
    const retentionDays = this.environmentService.values.AUDIT_RETENTION_DAYS;

    if (retentionDays <= 0) {
      return null;
    }

    const cutoff = new Date(Date.now() - retentionDays * MILLISECONDS_PER_DAY);

    // Acquire a distributed advisory lock so only one replica runs the purge.
    const acquired = await this.auditRepository.tryAdvisoryLock(PURGE_LOCK_ID);
    if (!acquired) {
      return null;
    }

    try {
      // Delete in batches to keep each transaction short; the lock lives until
      // the session ends (released implicitly on connection close or explicit
      // pg_advisory_unlock).  PostgreSQL does not release advisory locks on
      // transaction end by default.
      const deletedCount = await this.auditRepository.deleteOlderThanBatched(
        cutoff,
        BATCH_SIZE,
      );

      if (deletedCount > 0) {
        await this.recordAuditLogUseCase.execute({
          scope: SYSTEM_SCOPE.PLATFORM,
          action: 'audit.retention_purged',
          entityType: 'audit_log',
          metadata: {
            deletedCount,
            cutoff: cutoff.toISOString(),
            retentionDays,
          },
        });
      }

      return { deletedCount, cutoff };
    } finally {
      await this.auditRepository.unlockAdvisoryLock(PURGE_LOCK_ID);
    }
  }
}
