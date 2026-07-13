import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from '../jobs.repository.port';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';

export interface ListJobLogsQuery {
  page: number;
  limit: number;
}

@Injectable()
export class GetJobLogsUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
  ) {}

  async execute(jobId: string, query: ListJobLogsQuery) {
    const job = await this.jobsRepository.findById(jobId);

    if (!job) {
      throw new AppError(
        ERROR_CODES.JOB_NOT_FOUND,
        'Job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const result = await this.jobObservabilityRepository.listEvents({
      jobId,
      page: query.page,
      limit: query.limit,
    });

    return {
      rows: result.rows.map((event) => ({
        id: event.id,
        jobId: event.jobId,
        attemptId: event.attemptId,
        type: event.type,
        message: event.message,
        metadata: event.metadata,
        createdAt: event.createdAt.toISOString(),
      })),
      total: result.total,
    };
  }
}
