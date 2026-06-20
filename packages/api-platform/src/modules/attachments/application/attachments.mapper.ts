import type { AttachmentsRepository } from '../infrastructure/attachments.repository';

type AttachmentRecord = NonNullable<
  Awaited<ReturnType<AttachmentsRepository['findById']>>
>;

export class AttachmentsMapper {
  static toAttachmentDto(attachment: AttachmentRecord) {
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
