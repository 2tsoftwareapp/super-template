import { Module } from '@nestjs/common';
import { FILE_LOOKUP } from '@repo/api-core';

import { AuditModule } from '../audit/audit.module';
import { StorageModule } from '../storage/storage.module';
import { FileAccessService } from './application/services/file-access.service';
import { LocalFileDownloadUrlService } from './application/services/local-file-download-url.service';
import { BatchDeleteFilesUseCase } from './application/use-cases/batch-delete-files.use-case';
import { CreateFileVersionUseCase } from './application/use-cases/create-file-version.use-case';
import { DeleteFileUseCase } from './application/use-cases/delete-file.use-case';
import { DownloadFileUseCase } from './application/use-cases/download-file.use-case';
import { GetFileHistoryUseCase } from './application/use-cases/get-file-history.use-case';
import { GetFileSignedUrlUseCase } from './application/use-cases/get-file-signed-url.use-case';
import { GetFileUseCase } from './application/use-cases/get-file.use-case';
import { ListFileVersionsUseCase } from './application/use-cases/list-file-versions.use-case';
import { ListFilesUseCase } from './application/use-cases/list-files.use-case';
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
    ListFilesUseCase,
    CreateFileVersionUseCase,
    ListFileVersionsUseCase,
    GetFileHistoryUseCase,
    BatchDeleteFilesUseCase,
    {
      provide: FILE_LOOKUP,
      useExisting: FilesRepository,
    },
  ],
  exports: [FilesRepository, FILE_LOOKUP],
})
export class FilesModule {}
