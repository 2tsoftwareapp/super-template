import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-core";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  ACTIVITY_EMITTER,
  type ActivityEmitter,
  AppError,
  ERROR_CODES,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
  type TransactionPort,
} from "@repo/api-core";

import type { AttachEntityCommand } from "../attachments.types";

import { AuditService } from "../../../audit/application/audit.service";
import {
  FILES_REPOSITORY,
  type FilesRepositoryPort,
} from "../../../files/application/ports/files.repository.port";
import { AttachmentsMapper } from "../attachments.mapper";
import {
  ATTACHMENTS_REPOSITORY,
  type AttachmentsRepositoryPort,
} from "../ports/attachments.repository.port";

@Injectable()
export class AttachFileUseCase {
  constructor(
    @Inject(ATTACHMENTS_REPOSITORY)
    private readonly attachmentsRepository: AttachmentsRepositoryPort,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: AttachEntityCommand,
    requestContext?: RequestContext,
  ) {
    const file = await this.filesRepository.findById(input.fileId);

    if (!file) {
      throw new AppError(ERROR_CODES.FILE_NOT_FOUND, "File not found", HttpStatus.NOT_FOUND);
    }

    if (!file.organizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "Cannot attach a global file to an entity",
        HttpStatus.BAD_REQUEST,
      );
    }

    const attachment = await this.transactionPort.withTenant(
      { tenantId: file.organizationId, userId: actor.userId },
      async (tx) => {
        const attachRecord = await this.attachmentsRepository.create(
          {
            organizationId: file.organizationId!,
            fileId: input.fileId,
            entityType: input.entityType,
            entityId: input.entityId,
            label: input.label ?? null,
            createdById: actor.userId,
          },
          tx,
        );

        if (!attachRecord) {
          throw new Error("Attachment insert returned no rows");
        }

        await this.auditService.log(
          {
            actorId: actor.userId,
            action: "attachment.created",
            entityType: input.entityType,
            entityId: input.entityId,
            metadata: { attachmentId: attachRecord.id, fileId: input.fileId },
            requestContext,
            scope: SYSTEM_SCOPE.ORGANIZATION,
            organizationId: file.organizationId!,
          },
          tx,
        );

        await this.activityEmitter.emit(
          {
            organizationId: file.organizationId!,
            summary: `File "${file.originalName}" attached to ${input.entityType}`,
            entityType: "attachment",
            entityId: attachRecord.id,
            actorId: actor.userId,
            visibility: "INTERNAL",
            metadata: {
              fileId: input.fileId,
              targetEntityType: input.entityType,
              targetEntityId: input.entityId,
            },
          },
          tx,
        );

        return attachRecord;
      },
    );

    return AttachmentsMapper.toAttachmentDto(attachment);
  }
}
