import { Global, Module } from "@nestjs/common";
import { AUDIT_WRITER } from "@repo/api-runtime";
import { FilesModule } from "@repo/feature-upload/module";

import { AuditRetentionService } from "./application/audit-retention.service";
import { AuditMapper } from "./application/audit.mapper";
import { AuditService } from "./application/audit.service";
import { AUDIT_REPOSITORY } from "./application/ports/audit.repository.port";
import { DownloadAuditExportUseCase } from "./application/use-cases/download-audit-export.use-case";
import { ExportAuditLogsUseCase } from "./application/use-cases/export-audit-logs.use-case";
import { GetAuditLogUseCase } from "./application/use-cases/get-audit-log.use-case";
import { ListAuditLogsUseCase } from "./application/use-cases/list-audit-logs.use-case";
import { PurgeExpiredAuditLogsUseCase } from "./application/use-cases/purge-expired-audit-logs.use-case";
import { RecordAuditLogUseCase } from "./application/use-cases/record-audit-log.use-case";
import { AuditRepository } from "./infrastructure/audit.repository";
import { AuditController } from "./presentation/audit.controller";

// FILES_REPOSITORY / OBJECT_STORAGE come from global FilesModule (which imports
// StorageModule). Upload use cases depend on AUDIT_WRITER, not AuditModule, so
// there is no Files ↔ Audit Nest module cycle.
@Global()
@Module({
  imports: [FilesModule],
  controllers: [AuditController],
  providers: [
    AuditMapper,
    AuditRepository,
    {
      provide: AUDIT_REPOSITORY,
      useExisting: AuditRepository,
    },
    RecordAuditLogUseCase,
    ListAuditLogsUseCase,
    GetAuditLogUseCase,
    ExportAuditLogsUseCase,
    DownloadAuditExportUseCase,
    PurgeExpiredAuditLogsUseCase,
    AuditRetentionService,
    AuditService,
    {
      provide: AUDIT_WRITER,
      useExisting: AuditService,
    },
  ],
  exports: [AuditService, AUDIT_REPOSITORY, AUDIT_WRITER],
})
export class AuditModule {}
