import { Module } from "@nestjs/common";
import { AUDIT_WRITER } from "@repo/api-core";

import { FILES_REPOSITORY } from "../files/application/ports/files.repository.port";
import { FilesRepository } from "../files/infrastructure/files.repository";
import { StorageModule } from "../storage/storage.module";
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

// FilesRepository is provided directly (not via FilesModule) because FilesModule
// itself imports AuditModule; importing it back here would create a cycle.
@Module({
  imports: [StorageModule],
  controllers: [AuditController],
  providers: [
    AuditMapper,
    AuditRepository,
    FilesRepository,
    {
      provide: FILES_REPOSITORY,
      useExisting: FilesRepository,
    },
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
