import type { JsonObject } from "@repo/api-kernel";

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

export { BACKGROUND_JOB_ENQUEUER } from "./background-job-enqueuer.token";

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

export { BACKGROUND_JOB_ENQUEUER_WITH_RESULT } from "./background-job-enqueuer.token";
