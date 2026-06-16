import { HttpStatus, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';
import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import { AuditService } from '../../audit/application/audit.service';
import { FilesRepository } from '../../files/infrastructure/files.repository';
import { AttachmentsRepository } from '../infrastructure/attachments.repository';
import type {
  AttachEntityDto,
  AttachmentsQueryDto,
} from '../presentation/attachments.dto';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
    private readonly filesRepository: FilesRepository,
    private readonly auditService: AuditService,
  ) {}

  async attach(
    actor: AuthenticatedRequestUser,
    input: AttachEntityDto,
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

    return this.toAttachmentDto(attachment);
  }

  async list(query: AttachmentsQueryDto) {
    const rows = await this.attachmentsRepository.listByEntity(
      query.entityType,
      query.entityId,
    );

    return rows.map((row) => this.toAttachmentDto(row));
  }

  async delete(
    actor: AuthenticatedRequestUser,
    attachmentId: string,
    requestContext?: RequestContext,
  ) {
    const attachment = await this.attachmentsRepository.findById(attachmentId);

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

  private toAttachmentDto(
    attachment: NonNullable<
      Awaited<ReturnType<AttachmentsRepository['findById']>>
    >,
  ) {
    return {
      id: attachment.id,
      fileId: attachment.fileId,
      entityType: attachment.entityType,
      entityId: attachment.entityId,
      label: attachment.label,
      createdById: attachment.createdById,
      createdAt: attachment.createdAt.toISOString(),
      updatedAt: attachment.updatedAt.toISOString(),
    };
  }
}
