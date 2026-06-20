import { Inject, Injectable } from '@nestjs/common';

import type { JobView, ListJobsQuery } from '../jobs.types';

import { JobsMapper } from '../jobs.mapper';
import {
  JOBS_REPOSITORY,
  type JobsRepositoryPort,
} from '../jobs.repository.port';

@Injectable()
export class ListJobsUseCase {
  private readonly jobsMapper = new JobsMapper();

  constructor(
    @Inject(JOBS_REPOSITORY) private readonly jobsRepository: JobsRepositoryPort,
  ) {}

  async execute(query: ListJobsQuery): Promise<{ rows: JobView[]; total: number }> {
    const result = await this.jobsRepository.list({
      page: query.page,
      limit: query.limit,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    });

    return {
      rows: result.rows.map((row) => this.jobsMapper.toJobView(row)),
      total: result.total,
    };
  }
}
