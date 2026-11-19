import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { JobRow } from "@lean/db";

import { AppError, ERROR_CODES } from "../../shared/errors";
import { buildPageMeta, type PageMeta } from "../../shared/pagination";
import type { EnqueueJobDto, JobDto } from "./jobs.dto";
import { JobsRepository } from "./jobs.repository";

const toJobDto = (job: JobRow): JobDto => ({
  id: job.id,
  type: job.type,
  status: job.status,
  attempts: job.attempts,
  maxAttempts: job.maxAttempts,
  lastError: job.lastError,
  result: job.result,
  runAt: job.runAt.toISOString(),
  createdAt: job.createdAt.toISOString(),
});

@Injectable()
export class JobsService {
  constructor(@Inject(JobsRepository) private readonly jobs: JobsRepository) {}

  async enqueue(input: EnqueueJobDto): Promise<JobDto> {
    return toJobDto(await this.jobs.enqueue({ type: input.type, payload: input.payload ?? {} }));
  }

  async list(input: {
    page: number;
    limit: number;
    status?: "PENDING" | "PROCESSING" | "DONE" | "FAILED";
  }): Promise<{ data: JobDto[]; meta: PageMeta }> {
    const { rows, total } = await this.jobs.list(input);

    return { data: rows.map(toJobDto), meta: buildPageMeta(total, input.page, input.limit) };
  }

  async get(jobId: string): Promise<JobDto> {
    const job = await this.jobs.findById(jobId);

    if (!job) {
      throw new AppError(ERROR_CODES.JOB_NOT_FOUND, "Job not found", HttpStatus.NOT_FOUND);
    }

    return toJobDto(job);
  }
}
