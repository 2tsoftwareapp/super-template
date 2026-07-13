import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { AuditService } from '../../../audit/application/audit.service';
import { ATTACHMENTS_REPOSITORY, type AttachmentsRepositoryPort } from '../ports/attachments.repository.port';

@Injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENTS_REPOSITORY) private readonly attachmentsRepository: AttachmentsRepositoryPort,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    attachmentId: string,
    requestContext?: RequestContext,
  ) {
    const attachment =
      await this.attachmentsRepository.findById(attachmentId);

    if (!attachment) {
      throw new AppError(
        ERROR_CODES.ATTACHMENT_NOT_FOUND,
        'Attachment not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.attachmentsRepository.softDelete(attachmentId);

    await this.auditService.log({
      actorId: actor.userId,
      action: 'attachment.deleted',
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      metadata: { attachmentId },
      requestContext,
    });
  }
}
