import { Module } from "@nestjs/common";
import { FilesModule } from "@repo/feature-upload/module";

import { DownloadAuditExportUseCase } from "./application/download-audit-export.use-case";
import { ExportAuditLogsUseCase } from "./application/export-audit-logs.use-case";
import { AuditExportController } from "./presentation/audit-export.controller";

/**
 * Optional audit export capability: owns the upload/storage integration for
 * exporting and downloading the audit trail. Depends on the base audit writer
 * plus feature-upload; removing it leaves the audit writer fully functional.
 */
@Module({
  imports: [FilesModule],
  controllers: [AuditExportController],
  providers: [ExportAuditLogsUseCase, DownloadAuditExportUseCase],
  exports: [ExportAuditLogsUseCase, DownloadAuditExportUseCase],
})
export class AuditExportModule {}
