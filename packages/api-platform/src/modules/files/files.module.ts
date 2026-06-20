import { Module } from '@nestjs/common';
import { FILE_LOOKUP } from '@repo/api-core';

import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';
import { FilesService } from './application/files.service';
import { FileAccessService } from './application/services/file-access.service';
import { LocalFileDownloadUrlService } from './application/services/local-file-download-url.service';
import { DeleteFileUseCase } from './application/use-cases/delete-file.use-case';
import { DownloadFileUseCase } from './application/use-cases/download-file.use-case';
import { GetFileSignedUrlUseCase } from './application/use-cases/get-file-signed-url.use-case';
import { GetFileUseCase } from './application/use-cases/get-file.use-case';
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';
import { FilesRepository } from './infrastructure/files.repository';
import { FilesController } from './presentation/files.controller';

@Module({
  imports: [StorageModule, AuditModule],
  controllers: [FilesController],
  providers: [
    FilesRepository,
    LocalFileDownloadUrlService,
    FileAccessService,
    UploadFileUseCase,
    GetFileUseCase,
    GetFileSignedUrlUseCase,
    DownloadFileUseCase,
    DeleteFileUseCase,
    FilesService,
    {
      provide: FILE_LOOKUP,
      useExisting: FilesRepository,
    },
  ],
  exports: [FilesRepository, FilesService, FILE_LOOKUP],
})
export class FilesModule {}
