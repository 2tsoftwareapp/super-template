import { Module } from '@nestjs/common';
import { BACKGROUND_JOB_ENQUEUER } from '@repo/api-core';

import { MailModule } from '../mail/mail.module';
import { CancelJobUseCase } from './application/cancel-job.use-case';
import { EnqueueJobUseCase } from './application/enqueue-job.use-case';
import { JobHandlersRegistry } from './application/job-handlers.registry';
import { JobsMapper } from './application/jobs.mapper';
import { JobsProcessor } from './application/jobs.processor';
import { JOBS_REPOSITORY } from './application/jobs.repository.port';
import { JobsService } from './application/jobs.service';
import { ListJobsUseCase } from './application/list-jobs.use-case';
import { ProcessJobsUseCase } from './application/process-jobs.use-case';
import { JobsRepository } from './infrastructure/jobs.repository';
import { AdminJobsController } from './presentation/admin-jobs.controller';

@Module({
  imports: [MailModule],
  controllers: [AdminJobsController],
  providers: [
    JobsRepository,
    JobsMapper,
    JobHandlersRegistry,
    EnqueueJobUseCase,
    ListJobsUseCase,
    CancelJobUseCase,
    ProcessJobsUseCase,
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
