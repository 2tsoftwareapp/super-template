export interface ListActivitiesQuery {
  page: number;
  limit: number;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}
