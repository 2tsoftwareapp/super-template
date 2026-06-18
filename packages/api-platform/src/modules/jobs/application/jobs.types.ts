export type JobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export interface JobView {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  scheduledAt: string;
  priority: number;
  attempts: number;
  maxAttempts: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  errorMessage: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueJobCommand {
  type: string;
  payload: Record<string, unknown>;
  scheduledAt?: Date;
  priority?: number;
  createdById?: string | null;
  organizationId?: string | null;
  maxAttempts?: number;
  idempotencyKey?: string;
}

export interface ListJobsQuery {
  page: number;
  limit: number;
  status?: JobStatus;
  type?: string;
}

export interface JobHandlerContext {
  jobId: string;
  payload: Record<string, unknown>;
  organizationId: string | null;
  createdById: string | null;
}

export type JobHandler = (context: JobHandlerContext) => Promise<void>;
