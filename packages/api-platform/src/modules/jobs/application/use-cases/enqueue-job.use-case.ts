import { Inject, Injectable } from "@nestjs/common";

import type { EnqueueJobCommand, JobView } from "../jobs.types";

import { JobsMapper } from "../jobs.mapper";
import { JOBS_REPOSITORY, type JobsRepositoryPort } from "../ports/jobs.repository.port";

@Injectable()
export class EnqueueJobUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly jobsMapper: JobsMapper,
  ) {}

  async execute(input: EnqueueJobCommand): Promise<JobView> {
    const createdById = input.createdById ?? null;

    if (input.idempotencyKey && createdById) {
      const job = await this.jobsRepository.createIdempotent({
        type: input.type,
        payload: input.payload,
        scheduledAt: input.scheduledAt ?? new Date(),
        priority: input.priority ?? 0,
        createdById,
        organizationId: input.organizationId ?? null,
        maxAttempts: input.maxAttempts ?? 3,
        status: "PENDING",
        idempotencyKey: input.idempotencyKey,
      });

      if (!job) {
        throw new Error("Job insert returned no rows");
      }

      return this.jobsMapper.toJobView(job);
    }

    const job = await this.jobsRepository.create({
      type: input.type,
      payload: input.payload,
      scheduledAt: input.scheduledAt ?? new Date(),
      priority: input.priority ?? 0,
      createdById,
      organizationId: input.organizationId ?? null,
      maxAttempts: input.maxAttempts ?? 3,
      status: "PENDING",
      ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
    });

    if (!job) {
      throw new Error("Job insert returned no rows");
    }

    return this.jobsMapper.toJobView(job);
  }
}
