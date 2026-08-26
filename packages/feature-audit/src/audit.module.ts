import { Module } from "@nestjs/common";
import { FilesModule } from "@repo/feature-upload/module";

import { AuditRetentionService } from "./application/audit-retention.service";
import { AuditMapper } from "./application/audit.mapper";
import { DownloadAuditExportUseCase } from "./application/use-cases/download-audit-export.use-case";
import { ExportAuditLogsUseCase } from "./application/use-cases/export-audit-logs.use-case";
import { GetAuditLogUseCase } from "./application/use-cases/get-audit-log.use-case";
import { ListAuditLogsUseCase } from "./application/use-cases/list-audit-logs.use-case";
import { PurgeExpiredAuditLogsUseCase } from "./application/use-cases/purge-expired-audit-logs.use-case";
import { AuditCoreModule } from "./audit-core.module";
import { AuditController } from "./presentation/audit.controller";

/**
 * Audit admin surface: queries, export-to-files, retention. The upload
 * coupling lives ONLY here; writer consumers depend on AuditCoreModule's
 * AUDIT_WRITER port instead.
 */
@Module({
  imports: [AuditCoreModule, FilesModule],
  controllers: [AuditController],
  providers: [
    AuditMapper,
    ListAuditLogsUseCase,
    GetAuditLogUseCase,
    ExportAuditLogsUseCase,
    DownloadAuditExportUseCase,
    PurgeExpiredAuditLogsUseCase,
    AuditRetentionService,
  ],
  exports: [
    ListAuditLogsUseCase,
    GetAuditLogUseCase,
    ExportAuditLogsUseCase,
    DownloadAuditExportUseCase,
  ],
})
export class AuditModule {}
