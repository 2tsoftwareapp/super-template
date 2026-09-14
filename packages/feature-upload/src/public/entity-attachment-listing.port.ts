export interface EntityAttachmentRecord {
  id: string;
  fileId: string;
  entityType: string;
  entityId: string;
  label: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntityAttachmentListing {
  listByEntity(entityType: string, entityId: string): Promise<EntityAttachmentRecord[]>;
}

export { ENTITY_ATTACHMENT_LISTING } from "./entity-attachment-listing.token";
