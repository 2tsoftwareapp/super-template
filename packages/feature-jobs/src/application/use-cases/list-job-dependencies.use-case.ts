import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";

import {
  JOB_OBSERVABILITY_REPOSITORY,
  type JobObservabilityRepositoryPort,
} from "../ports/job-observability.repository.port";
import {
  JOBS_REPOSITORY,
  type JobScope,
  type JobsRepositoryPort,
} from "../ports/jobs.repository.port";

@Injectable()
export class ListJobDependenciesUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    @Inject(JOB_OBSERVABILITY_REPOSITORY)
    private readonly jobObservabilityRepository: JobObservabilityRepositoryPort,
  ) {}

  async execute(jobId: string, scope: JobScope) {
    const job = await this.jobsRepository.findById(jobId, scope);

    if (!job) {
      throw new AppError(ERROR_CODES.JOB_NOT_FOUND, "Job not found", HttpStatus.NOT_FOUND);
    }

    const dependencies = await this.jobObservabilityRepository.listDependencies(jobId);

    return dependencies.map((dep) => ({
      id: dep.id,
      dependsOnJobId: dep.dependsOnJobId,
      dependsOnJobStatus: dep.dependsOnJobStatus,
      createdAt: dep.createdAt.toISOString(),
    }));
  }
}
