import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { JobView } from '../jobs.types';

import { JobObservabilityRepository } from '../../infrastructure/job-observability.repository';
import { JobsMapper } from '../jobs.mapper';
import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from '../jobs.repository.port';

@Injectable()
export class CancelJobUseCase {
  private readonly jobsMapper = new JobsMapper();

  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly jobObservabilityRepository: JobObservabilityRepository,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    jobId: string,
  ): Promise<JobView> {
    const cancelled = await this.jobsRepository.markCancelled(jobId);

    if (!cancelled) {
      const existing = await this.jobsRepository.findById(jobId);

      if (!existing) {
        throw new AppError(
          ERROR_CODES.JOB_NOT_FOUND,
          'Job not found',
          HttpStatus.NOT_FOUND,
        );
      }

      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'Only pending jobs can be cancelled',
        HttpStatus.CONFLICT,
      );
    }

    await this.jobObservabilityRepository.recordEvent({
      jobId: cancelled.id,
      organizationId: cancelled.organizationId ?? null,
      type: 'cancelled',
      message: `Cancelled by user ${actor.userId}`,
    });

    return this.jobsMapper.toJobView(cancelled);
  }
}
