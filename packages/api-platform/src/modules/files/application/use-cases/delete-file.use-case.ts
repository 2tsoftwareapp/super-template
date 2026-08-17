import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-core";

import { Inject, Injectable } from "@nestjs/common";
import { SYSTEM_SCOPE } from "@repo/api-core";
import { TRANSACTION_PORT, type TransactionPort } from "@repo/api-core";

import { AuditService } from "../../../audit";
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from "../../../storage";
import { FILES_REPOSITORY, type FilesRepositoryPort } from "../ports/files.repository.port";
import { FileAccessService } from "../services/file-access.service";

@Injectable()
export class DeleteFileUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, fileId: string, requestContext?: RequestContext) {
    const file = await this.fileAccessService.findAccessibleFile(actor, fileId);

    await this.transactionPort.run(async (tx) => {
      await this.filesRepository.softDelete(file.id, tx);

      await this.auditService.log(
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
      console.error(
        `Failed to cleanup storage object ${file.storageKey} for deleted file ${file.id}:`,
        err,
      );
      // NOTE: Failure to delete storage object is ignored for now.
      // An outbox/cleanup worker should ideally sweep orphaned objects later.
    }
  }
}
