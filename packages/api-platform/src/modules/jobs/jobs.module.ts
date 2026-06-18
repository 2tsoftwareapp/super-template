import { Module } from '@nestjs/common';
import { BACKGROUND_JOB_ENQUEUER } from '@repo/api-core';

import { MailModule } from '../mail/mail.module';
import { JobsProcessor } from './application/jobs.processor';
import { JobsService } from './application/jobs.service';
import { JobsRepository } from './infrastructure/jobs.repository';
import { AdminJobsController } from './presentation/admin-jobs.controller';

@Module({
  imports: [MailModule],
  controllers: [AdminJobsController],
  providers: [
    JobsRepository,
    JobsService,
    JobsProcessor,
    {
      provide: BACKGROUND_JOB_ENQUEUER,
      useExisting: JobsService,
    },
  ],
  exports: [JobsRepository, JobsService, BACKGROUND_JOB_ENQUEUER],
})
export class JobsModule {}
