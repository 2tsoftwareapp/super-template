import { Module } from "@nestjs/common";

import { AuditModule } from "../audit";
import { FilesModule } from "../files/files.module";
import { StorageModule } from "../storage";
import { EXPORT_JOBS_REPOSITORY } from "./application/ports/export-jobs.repository.port";
import { ExportJobsRecoveryService } from "./application/services/export-jobs-recovery.service";
import { ExportJobsProcessor } from "./application/services/export-jobs.processor";
import { CreateExportUseCase } from "./application/use-cases/create-export.use-case";
import { GetExportUseCase } from "./application/use-cases/get-export.use-case";
import { ExportJobsRepository } from "./infrastructure/export-jobs.repository";
import { ExportsController } from "./presentation/exports.controller";

@Module({
  imports: [AuditModule, FilesModule, StorageModule],
  controllers: [ExportsController],
  providers: [
    ExportJobsRepository,
    ExportJobsProcessor,
    ExportJobsRecoveryService,
    CreateExportUseCase,
    GetExportUseCase,
    {
      provide: EXPORT_JOBS_REPOSITORY,
      useExisting: ExportJobsRepository,
    },
  ],
  exports: [EXPORT_JOBS_REPOSITORY],
})
export class ExportsModule {}
