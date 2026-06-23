import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { JobObservabilityRepository } from '../../infrastructure/job-observability.repository';
import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from '../jobs.repository.port';

export interface ListJobLogsQuery {
  page: number;
  limit: number;
}

@Injectable()
export class GetJobLogsUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly jobObservabilityRepository: JobObservabilityRepository,
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
