import type { AttachmentRecord } from "./ports/attachments.repository.port";

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
