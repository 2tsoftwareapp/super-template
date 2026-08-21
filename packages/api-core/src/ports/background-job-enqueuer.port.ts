import type { JsonObject } from "../common/types/json-value";

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

export const BACKGROUND_JOB_ENQUEUER = Symbol("BACKGROUND_JOB_ENQUEUER");

/** Minimal job identity returned by the with-result enqueuer. */
export interface BackgroundJobRef {
  id: string;
  status: string;
}

/**
 * Enqueuer variant for callers that need the created job reference
 * (e.g. audit entityId). Implemented by the jobs module's enqueue use case.
 */
export interface BackgroundJobEnqueuerWithResult {
  enqueueWithResult(input: BackgroundJobEnqueueInput): Promise<BackgroundJobRef>;
}

export const BACKGROUND_JOB_ENQUEUER_WITH_RESULT = Symbol("BACKGROUND_JOB_ENQUEUER_WITH_RESULT");
