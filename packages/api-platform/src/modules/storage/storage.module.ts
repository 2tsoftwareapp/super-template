import { Module } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core';

import { OBJECT_STORAGE } from './application/object-storage.interface';
import { STORAGE_TRACKING_PORT } from './application/ports/storage-tracking.port';
import { StorageCleanupService } from './application/storage-cleanup.service';
import { LocalObjectStorage } from './infrastructure/local-object-storage.service';
import { S3ObjectStorage } from './infrastructure/s3-object-storage.service';
import { StorageTrackingRepository } from './infrastructure/storage-tracking.repository';
import { TrackingObjectStorage } from './infrastructure/tracking-object-storage.service';

@Module({
  providers: [
    LocalObjectStorage,
    S3ObjectStorage,
    StorageTrackingRepository,
    StorageCleanupService,
    {
      provide: STORAGE_TRACKING_PORT,
      useExisting: StorageTrackingRepository,
    },
    {
      provide: OBJECT_STORAGE,
      useFactory: (
        environmentService: EnvironmentService,
        localStorage: LocalObjectStorage,
        s3Storage: S3ObjectStorage,
        tracking: StorageTrackingRepository,
      ) => {
        const driver =
          environmentService.values.STORAGE_DRIVER === 's3'
            ? s3Storage
            : localStorage;

        return new TrackingObjectStorage(driver, tracking);
      },
      inject: [EnvironmentService, LocalObjectStorage, S3ObjectStorage, StorageTrackingRepository],
    },
  ],
  exports: [
    OBJECT_STORAGE,
    LocalObjectStorage,
    S3ObjectStorage,
    StorageTrackingRepository,
    STORAGE_TRACKING_PORT,
  ],
})
export class StorageModule {}
