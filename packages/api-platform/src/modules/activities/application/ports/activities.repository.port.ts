import type { JsonObject } from '@repo/api-core';
import type { TransactionExecutor } from '@repo/api-core';

export interface ActivityRecord {
  id: string;
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  visibility: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  metadata: JsonObject | null;
  createdAt: Date;
}

export interface CreateActivityInput {
  organizationId: string;
  summary: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'INTERNAL';
  metadata?: JsonObject | null;
}

export interface ListActivitiesQuery {
  page: number;
  limit: number;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}

export interface ActivityListResult {
  rows: ActivityRecord[];
  total: number;
}

export interface ActivitiesRepositoryPort {
  create(values: CreateActivityInput, executor?: TransactionExecutor): Promise<ActivityRecord | null>;
  list(params: ListActivitiesQuery, executor?: TransactionExecutor): Promise<ActivityListResult>;
}

export const ACTIVITIES_REPOSITORY = Symbol('ACTIVITIES_REPOSITORY');
