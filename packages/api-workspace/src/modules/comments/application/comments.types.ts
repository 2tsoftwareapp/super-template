export interface ListCommentsQuery {
  page: number;
  limit: number;
  entityType: string;
  entityId: string;
}

export interface CreateCommentCommand {
  entityType: string;
  entityId: string;
  parentId?: string;
  content: string;
}

export interface UpdateCommentCommand {
  content: string;
}
