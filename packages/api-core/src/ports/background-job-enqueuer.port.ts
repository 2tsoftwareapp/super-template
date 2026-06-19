import type { JsonObject } from '../common/types/json-value';

export interface BackgroundJobEnqueueInput {
  type: string;
  organizationId: string | null;
  payload: JsonObject;
  createdById: string | null;
  scheduledAt?: Date;
  idempotencyKey?: string;
}

export interface BackgroundJobEnqueuer {
  enqueue(input: BackgroundJobEnqueueInput): Promise<void>;
}

export const BACKGROUND_JOB_ENQUEUER = Symbol('BACKGROUND_JOB_ENQUEUER');
