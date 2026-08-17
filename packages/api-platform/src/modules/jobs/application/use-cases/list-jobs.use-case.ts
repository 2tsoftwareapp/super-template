import { Inject, Injectable } from "@nestjs/common";

import type { JobListView, ListJobsQuery } from "../jobs.types";

import { JobsMapper } from "../jobs.mapper";
import {
  JOBS_REPOSITORY,
  type JobScope,
  type JobsRepositoryPort,
} from "../ports/jobs.repository.port";

@Injectable()
export class ListJobsUseCase {
  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
    private readonly jobsMapper: JobsMapper,
  ) {}

  async execute(
    query: ListJobsQuery & { scope: JobScope },
  ): Promise<{ rows: JobListView[]; total: number }> {
    const result = await this.jobsRepository.list({
      scope: query.scope,
      page: query.page,
      limit: query.limit,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    });

    return {
      rows: result.rows.map((row) => this.jobsMapper.toJobListView(row)),
      total: result.total,
    };
  }
}
