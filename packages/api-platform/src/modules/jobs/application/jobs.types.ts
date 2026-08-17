import type { JsonObject } from "@repo/api-core";

import type { JobStatus } from "../domain/job-status";

export type { JobStatus };

export interface JobView {
  id: string;
  type: string;
  payload: JsonObject;
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

/** JobView with payload redacted (used in list responses). */
export interface JobListView extends Omit<JobView, "payload"> {
  payload: Record<string, never>;
}

export interface EnqueueJobCommand {
  type: string;
  payload: JsonObject;
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
  payload: JsonObject;
  organizationId: string | null;
  createdById: string | null;
}

export type JobHandler = (context: JobHandlerContext) => Promise<void>;
