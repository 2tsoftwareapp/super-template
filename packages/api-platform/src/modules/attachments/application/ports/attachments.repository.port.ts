import type { DatabaseExecutor } from '@repo/api-database';

export interface AttachmentRecord {
  id: string;
  organizationId: string;
  fileId: string;
  entityType: string;
  entityId: string;
  label: string | null;
  createdById: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttachmentInput {
  organizationId: string;
  fileId: string;
  entityType: string;
  entityId: string;
  label: string | null;
  createdById: string | null;
}

export interface AttachmentsRepositoryPort {
  create(values: CreateAttachmentInput, executor?: DatabaseExecutor): Promise<AttachmentRecord | null>;
  findById(attachmentId: string, executor?: DatabaseExecutor): Promise<AttachmentRecord | null>;
  listByEntity(entityType: string, entityId: string, executor?: DatabaseExecutor): Promise<AttachmentRecord[]>;
  softDelete(attachmentId: string, executor?: DatabaseExecutor): Promise<AttachmentRecord | null>;
  countByEntity(entityType: string, entityId: string, executor?: DatabaseExecutor): Promise<number>;
}

export const ATTACHMENTS_REPOSITORY = Symbol('ATTACHMENTS_REPOSITORY');
