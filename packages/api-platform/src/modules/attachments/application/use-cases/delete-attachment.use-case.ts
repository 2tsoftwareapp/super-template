import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  AppError, ERROR_CODES , SYSTEM_SCOPE } from '@repo/api-core';

import { AuditService } from '../../../audit/application/audit.service';
import { ATTACHMENTS_REPOSITORY, type AttachmentsRepositoryPort } from '../ports/attachments.repository.port';
import { TRANSACTION_PORT, type TransactionPort } from '@repo/api-core';

@Injectable()
export class DeleteAttachmentUseCase {
  constructor(
    @Inject(ATTACHMENTS_REPOSITORY) private readonly attachmentsRepository: AttachmentsRepositoryPort,
    private readonly auditService: AuditService,
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
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

    await this.transactionPort.run(async (tx) => {
      await this.attachmentsRepository.softDelete(attachmentId, tx);

      await this.auditService.log({
        actorId: actor.userId,
        action: 'attachment.deleted',
        entityType: attachment.entityType,
        entityId: attachment.entityId,
        metadata: { attachmentId },
        requestContext,
        ...(attachment.organizationId ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: attachment.organizationId } : { scope: SYSTEM_SCOPE.PLATFORM })
      }, tx);
    });
  }
}
