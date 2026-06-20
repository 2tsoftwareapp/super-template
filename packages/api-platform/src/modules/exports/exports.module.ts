import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { StorageModule } from '../storage/storage.module';
import { ExportsService } from './application/exports.service';
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
    ExportsService,
  ],
  exports: [ExportJobsRepository, ExportsService],
})
export class ExportsModule {}
