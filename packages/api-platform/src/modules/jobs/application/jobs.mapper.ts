import type { JobRecord } from './jobs.repository.port';
import type { JobStatus, JobView } from './jobs.types';

export class JobsMapper {
  toJobView(job: JobRecord): JobView {
    return {
      id: job.id,
      type: job.type,
      payload: job.payload,
      status: job.status as JobStatus,
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
