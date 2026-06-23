import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { BackgroundJobEnqueueInput } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type { EnqueueJobCommand, JobHandler, ListJobsQuery } from './jobs.types';

import { JobHandlersRegistry } from './services/job-handlers.registry';
import { AddJobDependencyUseCase } from './use-cases/add-job-dependency.use-case';
import { CancelJobUseCase } from './use-cases/cancel-job.use-case';
import { EnqueueJobUseCase } from './use-cases/enqueue-job.use-case';
import {
  GetJobLogsUseCase,
  type ListJobLogsQuery,
} from './use-cases/get-job-logs.use-case';
import {
  GetJobMetricsUseCase,
  type JobMetricsQuery,
} from './use-cases/get-job-metrics.use-case';
import { GetJobUseCase } from './use-cases/get-job.use-case';
import { ListJobDependenciesUseCase } from './use-cases/list-job-dependencies.use-case';
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
    private readonly getJobUseCase: GetJobUseCase,
    private readonly getJobLogsUseCase: GetJobLogsUseCase,
    private readonly getJobMetricsUseCase: GetJobMetricsUseCase,
    private readonly addJobDependencyUseCase: AddJobDependencyUseCase,
    private readonly listJobDependenciesUseCase: ListJobDependenciesUseCase,
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

  getJob(jobId: string) {
    return this.getJobUseCase.execute(jobId);
  }

  getJobLogs(jobId: string, query: ListJobLogsQuery) {
    return this.getJobLogsUseCase.execute(jobId, query);
  }

  getJobMetrics(query: JobMetricsQuery) {
    return this.getJobMetricsUseCase.execute(query);
  }

  addJobDependency(jobId: string, dependsOnJobId: string) {
    return this.addJobDependencyUseCase.execute(jobId, dependsOnJobId);
  }

  listJobDependencies(jobId: string) {
    return this.listJobDependenciesUseCase.execute(jobId);
  }

  processDueJobs() {
    return this.processJobsUseCase.execute();
  }
}
