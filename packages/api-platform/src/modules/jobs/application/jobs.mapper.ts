import { Injectable } from "@nestjs/common";

import type { JobListView, JobView } from "./jobs.types";
import type { JobRecord } from "./ports/jobs.repository.port";

@Injectable()
export class JobsMapper {
  toJobView(job: JobRecord): JobView {
    return {
      id: job.id,
      type: job.type,
      payload: job.payload,
      status: job.status,
      scheduledAt: job.scheduledAt.toISOString(),
      priority: job.priority,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      cancelledAt: job.cancelledAt?.toISOString() ?? null,
      errorMessage: job.errorMessage ?? null,
      createdById: job.createdById ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  toJobListView(job: JobRecord): JobListView {
    return {
      id: job.id,
      type: job.type,
      payload: {},
      status: job.status,
      scheduledAt: job.scheduledAt.toISOString(),
      priority: job.priority,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      startedAt: job.startedAt?.toISOString() ?? null,
      completedAt: job.completedAt?.toISOString() ?? null,
      cancelledAt: job.cancelledAt?.toISOString() ?? null,
      errorMessage: job.errorMessage ?? null,
      createdById: job.createdById ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
