export interface ListAuditLogsQuery {
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  from?: string;
  to?: string;
}
