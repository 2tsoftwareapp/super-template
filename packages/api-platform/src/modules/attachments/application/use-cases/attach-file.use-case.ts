import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { AttachEntityCommand } from '../attachments.types';

import { AuditService } from '../../../audit/application/audit.service';
import { FilesRepository } from '../../../files/infrastructure/files.repository';
import { AttachmentsRepository } from '../../infrastructure/attachments.repository';
import { AttachmentsMapper } from '../attachments.mapper';

@Injectable()
export class AttachFileUseCase {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly filesRepository: FilesRepository,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: AttachEntityCommand,
    requestContext?: RequestContext,
  ) {
    const file = await this.filesRepository.findById(input.fileId);

    if (!file) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        'File not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const attachment = await this.attachmentsRepository.create({
      organizationId: file.organizationId,
      fileId: input.fileId,
      entityType: input.entityType,
      entityId: input.entityId,
      label: input.label ?? null,
      createdById: actor.userId,
    });

    if (!attachment) {
      throw new Error('Attachment insert returned no rows');
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'attachment.created',
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { attachmentId: attachment.id, fileId: input.fileId },
      requestContext,
    });

    return AttachmentsMapper.toAttachmentDto(attachment);
  }
}
