export interface AttachEntityCommand {
  fileId: string;
  entityType: string;
  entityId: string;
  label?: string;
}

export interface ListAttachmentsQuery {
  entityType: string;
  entityId: string;
}
