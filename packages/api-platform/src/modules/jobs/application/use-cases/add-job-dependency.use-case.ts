import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { JobObservabilityRepository } from '../../infrastructure/job-observability.repository';
import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from '../jobs.repository.port';

@Injectable()
export class AddJobDependencyUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly jobObservabilityRepository: JobObservabilityRepository,
  ) {}

  async execute(jobId: string, dependsOnJobId: string) {
    if (jobId === dependsOnJobId) {
      throw new AppError(
        ERROR_CODES.JOB_DEPENDENCY_CYCLE,
        'A job cannot depend on itself',
        HttpStatus.CONFLICT,
      );
    }

    const [job, dependsOnJob] = await Promise.all([
      this.jobsRepository.findById(jobId),
      this.jobsRepository.findById(dependsOnJobId),
    ]);

    if (!job || !dependsOnJob) {
      throw new AppError(
        ERROR_CODES.JOB_NOT_FOUND,
        'Job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const wouldCycle = await this.jobObservabilityRepository.wouldCreateCycle(
      jobId,
      dependsOnJobId,
    );

    if (wouldCycle) {
      throw new AppError(
        ERROR_CODES.JOB_DEPENDENCY_CYCLE,
        'Adding this dependency would create a cycle',
        HttpStatus.CONFLICT,
      );
    }

    const dependency = await this.jobObservabilityRepository.addDependency({
      jobId,
      organizationId: job.organizationId ?? null,
      dependsOnJobId,
    });

    return {
      id: dependency.id,
      dependsOnJobId: dependency.dependsOnJobId,
      dependsOnJobStatus: dependsOnJob.status,
      createdAt: dependency.createdAt.toISOString(),
    };
  }
}
