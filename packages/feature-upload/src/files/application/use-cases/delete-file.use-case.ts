import type { AppLogger, AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import { APP_LOGGER, SYSTEM_SCOPE } from "@repo/api-kernel";
import { TRANSACTION_PORT } from "@repo/api-kernel";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import { OBJECT_STORAGE, type ObjectStorage } from "../../../storage";
import {
  STORAGE_TRACKING_PORT,
  type StorageTrackingPort,
} from "../../../storage/application/ports/storage-tracking.port";
import { FILES_REPOSITORY, type FilesRepositoryPort } from "../ports/files.repository.port";
import { FileAccessService } from "../services/file-access.service";

@Injectable()
export class DeleteFileUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    @Inject(STORAGE_TRACKING_PORT) private readonly storageTracking: StorageTrackingPort,
    @Inject(APP_LOGGER) private readonly logger: AppLogger,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, fileId: string, requestContext?: RequestContext) {
    const file = await this.fileAccessService.findAccessibleFile(actor, fileId);

    await this.transactionPort.run(async (tx) => {
      await this.filesRepository.softDelete(file.id, tx);

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "file.deleted",
          entityType: "file",
          entityId: file.id,
          requestContext,
          ...(file.organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: file.organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        tx,
      );
    });

    try {
      await this.objectStorage.delete(file.storageKey);
    } catch (err) {
      // Compensation failure must be visible and recoverable: log it, then
      // record a retry in the storage-delete outbox so StorageCleanupService
      // retries the delete instead of the object being orphaned silently.
      this.logger.error(`Failed to delete storage object ${file.storageKey} for file ${file.id}`, {
        error: err instanceof Error ? err.message : String(err),
      });

      try {
        await this.storageTracking.enqueueDelete(file.storageKey);
      } catch (enqueueError) {
        this.logger.error(
          `Failed to enqueue delete retry for storage object ${file.storageKey} (file ${file.id})`,
          {
            error: enqueueError instanceof Error ? enqueueError.message : String(enqueueError),
          },
        );
      }
    }
  }
}
