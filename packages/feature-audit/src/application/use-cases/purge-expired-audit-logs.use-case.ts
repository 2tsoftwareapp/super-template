import { Inject, Injectable } from "@nestjs/common";
import { EnvironmentService, SYSTEM_SCOPE } from "@repo/api-runtime";
import {
  ADVISORY_LOCK_PORT,
  type AdvisoryLockPort,
  PLATFORM_TRANSACTION_PORT,
  type PlatformTransactionPort,
} from "@repo/api-runtime";

import { AUDIT_REPOSITORY, type AuditRepositoryPort } from "../ports/audit.repository.port";
import { RecordAuditLogUseCase } from "./record-audit-log.use-case";

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
    @Inject(PLATFORM_TRANSACTION_PORT)
    private readonly platformTransactionPort: PlatformTransactionPort,
  ) {}

  async execute(): Promise<{ deletedCount: number; cutoff: Date } | null> {
    const retentionDays = this.environmentService.values.AUDIT_RETENTION_DAYS;

    if (retentionDays <= 0) {
      return null;
    }

    const cutoff = new Date(Date.now() - retentionDays * MILLISECONDS_PER_DAY);

    // Acquire a distributed advisory lock so only one replica runs the purge.
    return this.advisoryLockPort.withAdvisoryLock(PURGE_LOCK_ID, async () => {
      let totalDeleted = 0;

      for (;;) {
        const deletedInBatch = await this.platformTransactionPort.run(async (tx) => {
          // Delete one batch per transaction to keep locks short
          return this.auditRepository.deleteOlderThanBatched(cutoff, BATCH_SIZE, tx);
        });

        if (deletedInBatch === 0) {
          break;
        }

        totalDeleted += deletedInBatch;
      }

      if (totalDeleted > 0) {
        await this.platformTransactionPort.run(async (tx) => {
          await this.recordAuditLogUseCase.execute(
            {
              scope: SYSTEM_SCOPE.PLATFORM,
              action: "audit.retention_purged",
              entityType: "audit_log",
              metadata: {
                deletedCount: totalDeleted,
                cutoff: cutoff.toISOString(),
                retentionDays,
              },
            },
            tx,
          );
        });
      }

      return { deletedCount: totalDeleted, cutoff };
    });
  }
}
