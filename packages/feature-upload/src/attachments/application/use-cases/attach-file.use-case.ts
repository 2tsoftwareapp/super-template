import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import type { AttachEntityCommand } from "../attachments.types";

import { FileAccessService } from "../../../files";
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
    private readonly fileAccessService: FileAccessService,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: AttachEntityCommand,
    requestContext?: RequestContext,
  ) {
    // Attaching is a read of the file plus a new attachment row, so it enforces
    // the same rules as get/download (FileAccessService) instead of only
    // checking that the id exists. Note `findAccessibleFile` already answers
    // FILE_NOT_FOUND for a missing row.
    const file = await this.fileAccessService.findAccessibleFile(actor, input.fileId);

    // Explicit rule, kept as-is: attachments are organization-scoped, so a
    // platform-scoped (global) file stays unattachable even for an actor the
    // access policy would otherwise allow to read it.
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

        await this.auditWriter.log(
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
