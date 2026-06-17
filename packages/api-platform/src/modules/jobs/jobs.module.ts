import { Module } from '@nestjs/common';
import { AuthDataModule } from '@repo/api-identity/modules/auth/auth-data.module';
import { NotificationsModule } from '@repo/api-workspace/modules/notifications/notifications.module';

import { MailModule } from '../mail/mail.module';
import { JobsProcessor } from './application/jobs.processor';
import { JobsService } from './application/jobs.service';
import { JobsRepository } from './infrastructure/jobs.repository';
import { AdminJobsController } from './presentation/admin-jobs.controller';

@Module({
  imports: [MailModule, AuthDataModule, NotificationsModule],
  controllers: [AdminJobsController],
  providers: [JobsRepository, JobsService, JobsProcessor],
  exports: [JobsRepository, JobsService],
})
export class JobsModule {}
