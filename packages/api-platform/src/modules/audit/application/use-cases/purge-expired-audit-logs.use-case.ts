import { Injectable } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core';

import { AuditRepository } from '../../infrastructure/audit.repository';
import { RecordAuditLogUseCase } from './record-audit-log.use-case';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class PurgeExpiredAuditLogsUseCase {
  constructor(
    private readonly auditRepository: AuditRepository,
    private readonly recordAuditLogUseCase: RecordAuditLogUseCase,
    private readonly environmentService: EnvironmentService,
  ) {}

  async execute(): Promise<{ deletedCount: number; cutoff: Date } | null> {
    const retentionDays = this.environmentService.values.AUDIT_RETENTION_DAYS;

    if (retentionDays <= 0) {
      return null;
    }

    const cutoff = new Date(Date.now() - retentionDays * MILLISECONDS_PER_DAY);
    const deletedCount = await this.auditRepository.deleteOlderThan(cutoff);

    // The purge action itself is recorded after the delete, so it is never
    // among the rows it just removed — keeping the audit trail of the purge intact.
    if (deletedCount > 0) {
      await this.recordAuditLogUseCase.execute({
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
  }
}
