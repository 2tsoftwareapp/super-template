import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from '../jobs.repository.port';
import { JOB_OBSERVABILITY_REPOSITORY, type JobObservabilityRepositoryPort } from '../ports/job-observability.repository.port';

@Injectable()
export class ListJobDependenciesUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY) private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
  ) {}

  async execute(jobId: string) {
    const job = await this.jobsRepository.findById(jobId);

    if (!job) {
      throw new AppError(
        ERROR_CODES.JOB_NOT_FOUND,
        'Job not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const dependencies = await this.jobObservabilityRepository.listDependencies(
      jobId,
    );

    return dependencies.map((dependency) => ({
      id: dependency.id,
      dependsOnJobId: dependency.dependsOnJobId,
      dependsOnJobStatus: dependency.dependsOnJobStatus,
      createdAt: dependency.createdAt.toISOString(),
    }));
  }
}
