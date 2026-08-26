import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, SYSTEM_SCOPE, TRANSACTION_PORT, type TransactionPort } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/api-runtime";
import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";

import {
  ATTACHMENTS_REPOSITORY,
  type AttachmentsRepositoryPort,
} from "../ports/attachments.repository.port";

@Injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENTS_REPOSITORY)
    private readonly attachmentsRepository: AttachmentsRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    attachmentId: string,
    requestContext?: RequestContext,
  ) {
    const attachment = await this.attachmentsRepository.findById(attachmentId);

    if (!attachment) {
      throw new AppError(
        ERROR_CODES.ATTACHMENT_NOT_FOUND,
        "Attachment not found",
        HttpStatus.NOT_FOUND,
      );
    }

    await this.transactionPort.run(async (tx) => {
      await this.attachmentsRepository.softDelete(attachmentId, tx);

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "attachment.deleted",
          entityType: attachment.entityType,
          entityId: attachment.entityId,
          metadata: { attachmentId },
          requestContext,
          ...(attachment.organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: attachment.organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        tx,
      );

      if (attachment.organizationId) {
        await this.activityEmitter.emit(
          {
            organizationId: attachment.organizationId,
            summary: `Attachment removed from ${attachment.entityType}`,
            entityType: "attachment",
            entityId: attachment.id,
            actorId: actor.userId,
            visibility: "INTERNAL",
            metadata: {
              fileId: attachment.fileId,
              targetEntityType: attachment.entityType,
              targetEntityId: attachment.entityId,
            },
          },
          tx,
        );
      }
    });
  }
}
