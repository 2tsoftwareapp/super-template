import { Inject, Injectable } from '@nestjs/common';
import {  EnvironmentService , SYSTEM_SCOPE } from '@repo/api-core';
import { ADVISORY_LOCK_PORT, PLATFORM_TRANSACTION_PORT, type AdvisoryLockPort, type PlatformTransactionPort } from '@repo/api-core';

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
    @Inject(ADVISORY_LOCK_PORT) private readonly advisoryLockPort: AdvisoryLockPort,
    @Inject(PLATFORM_TRANSACTION_PORT) private readonly platformTransactionPort: PlatformTransactionPort,
  ) {}

  async execute(): Promise<{ deletedCount: number; cutoff: Date } | null> {
    const retentionDays = this.environmentService.values.AUDIT_RETENTION_DAYS;

    if (retentionDays <= 0) {
      return null;
    }

    const cutoff = new Date(Date.now() - retentionDays * MILLISECONDS_PER_DAY);

    // Acquire a distributed advisory lock so only one replica runs the purge.
    return this.advisoryLockPort.withAdvisoryLock(PURGE_LOCK_ID, async () => {
      return this.platformTransactionPort.run(async (tx) => {
        // Delete in batches to keep each transaction short; the lock lives until
        // the session ends (released implicitly on connection close or explicit
        // pg_advisory_unlock).  PostgreSQL does not release advisory locks on
        // transaction end by default.
        const deletedCount = await this.auditRepository.deleteOlderThanBatched(
          cutoff,
          BATCH_SIZE,
          tx,
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
          }, tx);
        }

        return { deletedCount, cutoff };
      });
    });
  }
}
