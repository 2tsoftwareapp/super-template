import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { AttachmentsModule } from '@repo/api-platform/modules/attachments/attachments.module';
import { AuditModule } from '@repo/api-platform/modules/audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '@repo/api-identity/modules/users/users.module';
import { ProjectsService } from './application/projects.service';
import { ProjectsRepository } from './infrastructure/projects.repository';
import { ProjectsController } from './presentation/projects.controller';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    AuditModule,
    ActivitiesModule,
    AttachmentsModule,
  ],
  controllers: [ProjectsController],
  providers: [ProjectsRepository, ProjectsService],
  exports: [ProjectsRepository, ProjectsService],
})
export class ProjectsModule {}
