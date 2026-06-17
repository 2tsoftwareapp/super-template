export interface BackgroundJobEnqueueInput {
  type: string;
  organizationId: string | null;
  payload: Record<string, unknown>;
  createdById: string | null;
  scheduledAt?: Date;
  idempotencyKey?: string;
}

export interface BackgroundJobEnqueuer {
  enqueue(input: BackgroundJobEnqueueInput): Promise<unknown>;
}

export const BACKGROUND_JOB_ENQUEUER = Symbol('BACKGROUND_JOB_ENQUEUER');
