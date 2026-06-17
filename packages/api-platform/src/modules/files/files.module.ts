import { Module } from '@nestjs/common';
import { FILE_LOOKUP } from '@repo/api-core';

import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';
import { FilesService } from './application/files.service';
import { LocalFileDownloadUrlService } from './application/local-file-download-url.service';
import { FilesRepository } from './infrastructure/files.repository';
import { FilesController } from './presentation/files.controller';

@Module({
  imports: [StorageModule, AuditModule],
  controllers: [FilesController],
  providers: [
    FilesRepository,
    FilesService,
    LocalFileDownloadUrlService,
    {
      provide: FILE_LOOKUP,
      useExisting: FilesRepository,
    },
  ],
  exports: [FilesRepository, FilesService, FILE_LOOKUP],
})
export class FilesModule {}
