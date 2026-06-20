import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { AuditService } from '../../../audit/application/audit.service';
import { AttachmentsRepository } from '../../infrastructure/attachments.repository';

@Injectable()
export class DeleteAttachmentUseCase {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
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
