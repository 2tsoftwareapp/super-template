import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-core";

import type { JobView } from "../jobs.types";

import { JobsMapper } from "../jobs.mapper";
import {
  JOBS_REPOSITORY,
  type JobScope,
  type JobsRepositoryPort,
} from "../ports/jobs.repository.port";

@Injectable()
export class GetJobUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly jobsMapper: JobsMapper,
  ) {}

  async execute(jobId: string, scope: JobScope): Promise<JobView> {
    const job = await this.jobsRepository.findById(jobId, scope);

    if (!job) {
      throw new AppError(ERROR_CODES.JOB_NOT_FOUND, "Job not found", HttpStatus.NOT_FOUND);
    }

    return this.jobsMapper.toJobView(job);
  }
}
