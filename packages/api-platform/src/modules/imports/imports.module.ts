import { Module } from '@nestjs/common';
import { ImportExportAdapterRegistry } from '@repo/api-core';
import { IdentityPortsModule } from '@repo/api-identity';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { StorageModule } from '../storage/storage.module';
import { ImportsMapper } from './application/imports.mapper';
import { IMPORT_JOBS_REPOSITORY } from './application/ports/imports.repository.port';
import { ImportFileParserService } from './application/services/import-file-parser.service';
import { ConfirmImportUseCase } from './application/use-cases/confirm-import.use-case';
import { CreateImportUseCase } from './application/use-cases/create-import.use-case';
import { GetImportUseCase } from './application/use-cases/get-import.use-case';
import { ImportJobsRepository } from './infrastructure/import-jobs.repository';
import { UsersImportExportAdapter } from './infrastructure/users-import-export.adapter';
import { ImportsController } from './presentation/imports.controller';

@Module({
  imports: [AuditModule, FilesModule, StorageModule, IdentityPortsModule],
  controllers: [ImportsController],
  providers: [
    ImportJobsRepository,
    ImportsMapper,
    ImportFileParserService,
    GetImportUseCase,
    CreateImportUseCase,
    ConfirmImportUseCase,
    UsersImportExportAdapter,
    {
      provide: IMPORT_JOBS_REPOSITORY,
      useExisting: ImportJobsRepository,
    },
  ],
  exports: [IMPORT_JOBS_REPOSITORY],
})
export class ImportsModule {
  constructor(
    private readonly usersAdapter: UsersImportExportAdapter,
    private readonly adapterRegistry: ImportExportAdapterRegistry,
  ) {
    this.adapterRegistry.register(this.usersAdapter);
  }
}
