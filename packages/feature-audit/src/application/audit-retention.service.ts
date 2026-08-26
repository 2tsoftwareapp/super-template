import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { APP_LOGGER, type AppLogger, ErrorReporterService } from "@repo/api-runtime";

import { PurgeExpiredAuditLogsUseCase } from "./use-cases/purge-expired-audit-logs.use-case";

@Injectable()
export class AuditRetentionService {
  constructor(
    private readonly purgeExpiredAuditLogsUseCase: PurgeExpiredAuditLogsUseCase,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    private readonly errorReporter: ErrorReporterService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredAuditLogs(): Promise<void> {
    try {
      const result = await this.purgeExpiredAuditLogsUseCase.execute();

      if (result && result.deletedCount > 0) {
        this.logger.info("Purged expired audit logs", {
          deletedCount: String(result.deletedCount),
          cutoff: result.cutoff.toISOString(),
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Failed to purge expired audit logs", {
        error: message,
      });

      if (error instanceof Error) {
        this.errorReporter.reportException(error, {
          errorCode: "AUDIT_RETENTION_PURGE_FAILED",
          tags: { job: "audit-retention-purge" },
        });
      }
    }
  }
}
