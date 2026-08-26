import { Module } from "@nestjs/common";
import { FilesModule } from "@repo/feature-upload/module";

import { AuditMapper } from "./application/audit.mapper";
import { DownloadAuditExportUseCase } from "./application/use-cases/download-audit-export.use-case";
import { ExportAuditLogsUseCase } from "./application/use-cases/export-audit-logs.use-case";
import { AuditCoreModule } from "./audit-core.module";
import { AuditExportController } from "./presentation/audit-export.controller";

/**
 * Audit export surface: export-to-CSV-files and download.
 * The upload coupling lives ONLY here; the base AuditModule stays free of it.
 */
@Module({
  imports: [AuditCoreModule, FilesModule],
  controllers: [AuditExportController],
  providers: [AuditMapper, ExportAuditLogsUseCase, DownloadAuditExportUseCase],
  exports: [ExportAuditLogsUseCase, DownloadAuditExportUseCase],
})
export class AuditExportModule {}
