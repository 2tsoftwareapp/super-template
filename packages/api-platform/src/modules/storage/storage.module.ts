import { Module } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core/config/environment.service';
import { OBJECT_STORAGE } from './application/object-storage.interface';
import { LocalObjectStorage } from './infrastructure/local-object-storage.service';
import { S3ObjectStorage } from './infrastructure/s3-object-storage.service';

@Module({
  providers: [
    LocalObjectStorage,
    S3ObjectStorage,
    {
      provide: OBJECT_STORAGE,
      useFactory: (
        environmentService: EnvironmentService,
        localStorage: LocalObjectStorage,
        s3Storage: S3ObjectStorage,
      ) => {
        return environmentService.values.STORAGE_DRIVER === 's3'
          ? s3Storage
          : localStorage;
      },
      inject: [EnvironmentService, LocalObjectStorage, S3ObjectStorage],
    },
  ],
  exports: [OBJECT_STORAGE, LocalObjectStorage, S3ObjectStorage],
})
export class StorageModule {}
