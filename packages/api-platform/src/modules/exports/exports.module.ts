import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { StorageModule } from '../storage/storage.module';
import { EXPORT_JOBS_REPOSITORY } from './application/ports/export-jobs.repository.port';
import { CreateExportUseCase } from './application/use-cases/create-export.use-case';
import { GetExportUseCase } from './application/use-cases/get-export.use-case';
import { ExportJobsRepository } from './infrastructure/export-jobs.repository';
import { ExportsController } from './presentation/exports.controller';

@Module({
  imports: [AuditModule, FilesModule, StorageModule],
  controllers: [ExportsController],
  providers: [
    ExportJobsRepository,
    CreateExportUseCase,
    GetExportUseCase,
    {
      provide: EXPORT_JOBS_REPOSITORY,
      useExisting: ExportJobsRepository,
    },
  ],
  exports: [ExportJobsRepository, EXPORT_JOBS_REPOSITORY],
})
export class ExportsModule {}
