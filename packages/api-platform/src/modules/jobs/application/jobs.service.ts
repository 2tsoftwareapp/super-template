import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { BackgroundJobEnqueueInput } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { EnqueueJobCommand, JobHandler, ListJobsQuery } from './jobs.types';

import { JobHandlersRegistry } from './services/job-handlers.registry';
import { CancelJobUseCase } from './use-cases/cancel-job.use-case';
import { EnqueueJobUseCase } from './use-cases/enqueue-job.use-case';
import { ListJobsUseCase } from './use-cases/list-jobs.use-case';
import { ProcessJobsUseCase } from './use-cases/process-jobs.use-case';

export type { JobHandler } from './jobs.types';

@Injectable()
export class JobsService {
  constructor(
    private readonly enqueueJobUseCase: EnqueueJobUseCase,
    private readonly listJobsUseCase: ListJobsUseCase,
    private readonly cancelJobUseCase: CancelJobUseCase,
    private readonly processJobsUseCase: ProcessJobsUseCase,
    private readonly jobHandlersRegistry: JobHandlersRegistry,
  ) {}

  registerHandler(type: string, handler: JobHandler) {
    this.jobHandlersRegistry.registerHandler(type, handler);
  }

  enqueue(input: EnqueueJobCommand | BackgroundJobEnqueueInput) {
    return this.enqueueJobUseCase.execute(input);
  }

  listJobs(query: ListJobsQuery) {
    return this.listJobsUseCase.execute(query);
  }

  cancelJob(actor: AuthenticatedRequestUser, jobId: string) {
    return this.cancelJobUseCase.execute(actor, jobId);
  }

  processDueJobs() {
    return this.processJobsUseCase.execute();
  }
}
