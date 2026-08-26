import { Module } from "@nestjs/common";

import { AuditRetentionService } from "./application/audit-retention.service";
import { AuditMapper } from "./application/audit.mapper";
import { GetAuditLogUseCase } from "./application/use-cases/get-audit-log.use-case";
import { ListAuditLogsUseCase } from "./application/use-cases/list-audit-logs.use-case";
import { PurgeExpiredAuditLogsUseCase } from "./application/use-cases/purge-expired-audit-logs.use-case";
import { AuditCoreModule } from "./audit-core.module";
import { AuditController } from "./presentation/audit.controller";

/**
 * Audit admin surface: list, get, purge. Free of feature-upload coupling so
 * consumers never pull the export/file-storage stack transitively.
 * Export/download lives in AuditExportModule.
 */
@Module({
  imports: [AuditCoreModule],
  controllers: [AuditController],
  providers: [
    AuditMapper,
    ListAuditLogsUseCase,
    GetAuditLogUseCase,
    PurgeExpiredAuditLogsUseCase,
    AuditRetentionService,
  ],
  exports: [ListAuditLogsUseCase, GetAuditLogUseCase],
})
export class AuditModule {}
