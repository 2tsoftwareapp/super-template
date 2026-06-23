import { forwardRef, Module } from '@nestjs/common';
import { BACKGROUND_JOB_ENQUEUER } from '@repo/api-core';

import { MailModule } from '../mail/mail.module';
import { JobsMapper } from './application/jobs.mapper';
import { JobsProcessor } from './application/jobs.processor';
import { JOBS_REPOSITORY } from './application/jobs.repository.port';
import { JobsService } from './application/jobs.service';
import { JobHandlersRegistry } from './application/services/job-handlers.registry';
import { AddJobDependencyUseCase } from './application/use-cases/add-job-dependency.use-case';
import { CancelJobUseCase } from './application/use-cases/cancel-job.use-case';
import { EnqueueJobUseCase } from './application/use-cases/enqueue-job.use-case';
import { GetJobLogsUseCase } from './application/use-cases/get-job-logs.use-case';
import { GetJobMetricsUseCase } from './application/use-cases/get-job-metrics.use-case';
import { GetJobUseCase } from './application/use-cases/get-job.use-case';
import { ListJobDependenciesUseCase } from './application/use-cases/list-job-dependencies.use-case';
import { ListJobsUseCase } from './application/use-cases/list-jobs.use-case';
import { ProcessJobsUseCase } from './application/use-cases/process-jobs.use-case';
import { JobObservabilityRepository } from './infrastructure/job-observability.repository';
import { JobsRepository } from './infrastructure/jobs.repository';
import { AdminJobsController } from './presentation/admin-jobs.controller';

@Module({
  imports: [forwardRef(() => MailModule)],
  controllers: [AdminJobsController],
  providers: [
    JobsRepository,
    JobObservabilityRepository,
    JobsMapper,
    JobHandlersRegistry,
    EnqueueJobUseCase,
    ListJobsUseCase,
    CancelJobUseCase,
    ProcessJobsUseCase,
    GetJobUseCase,
    GetJobLogsUseCase,
    GetJobMetricsUseCase,
    AddJobDependencyUseCase,
    ListJobDependenciesUseCase,
    JobsService,
    JobsProcessor,
    {
      provide: JOBS_REPOSITORY,
      useExisting: JobsRepository,
    },
    {
      provide: BACKGROUND_JOB_ENQUEUER,
      useExisting: JobsService,
    },
  ],
  exports: [JobsRepository, JobsService, BACKGROUND_JOB_ENQUEUER, JOBS_REPOSITORY],
})
export class JobsModule {}
