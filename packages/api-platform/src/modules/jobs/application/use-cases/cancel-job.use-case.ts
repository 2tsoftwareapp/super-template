import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { JobView } from '../jobs.types';

import { JobsMapper } from '../jobs.mapper';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';
import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
  type JobScope,
} from '../ports/jobs.repository.port';

@Injectable()
export class CancelJobUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
    private readonly jobsMapper: JobsMapper,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    jobId: string,
  ): Promise<JobView> {
    const scope = this.buildScope(actor);
    const cancelled = await this.jobsRepository.markCancelled(jobId);

    if (!cancelled) {
      const existing = await this.jobsRepository.findById(jobId, scope);

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

  private buildScope(actor: AuthenticatedRequestUser): JobScope {
    return actor.organizationId
      ? { type: 'organization', organizationId: actor.organizationId }
      : { type: 'platform' };
  }
}