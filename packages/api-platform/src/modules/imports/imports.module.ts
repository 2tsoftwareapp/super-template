import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { StorageModule } from '../storage/storage.module';
import { ConfirmImportUseCase } from './application/confirm-import.use-case';
import { CreateImportUseCase } from './application/create-import.use-case';
import { GetImportUseCase } from './application/get-import.use-case';
import { ImportFileParserService } from './application/import-file-parser.service';
import { ImportsMapper } from './application/imports.mapper';
import { IMPORT_JOBS_REPOSITORY } from './application/imports.repository.port';
import { ImportsService } from './application/imports.service';
import { ImportJobsRepository } from './infrastructure/import-jobs.repository';
import { ImportsController } from './presentation/imports.controller';

@Module({
  imports: [AuditModule, FilesModule, StorageModule],
  controllers: [ImportsController],
  providers: [
    ImportJobsRepository,
    ImportsMapper,
    ImportFileParserService,
    GetImportUseCase,
    CreateImportUseCase,
    ConfirmImportUseCase,
    ImportsService,
    {
      provide: IMPORT_JOBS_REPOSITORY,
      useExisting: ImportJobsRepository,
    },
  ],
  exports: [ImportJobsRepository, ImportsService, IMPORT_JOBS_REPOSITORY],
})
export class ImportsModule {}
