import { Module } from '@nestjs/common';
import { PROJECT_DEMO_GATEWAY } from '@repo/api-core';
import { OrganizationsModule } from '@repo/api-identity/modules/organizations/organizations.module';
import { UsersModule } from '@repo/api-identity/modules/users/users.module';
import { AttachmentsModule } from '@repo/api-platform/modules/attachments/attachments.module';
import { AuditModule } from '@repo/api-platform/modules/audit/audit.module';

import { ActivitiesModule } from '../activities/activities.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsService } from './application/projects.service';
import { ProjectsRepository } from './infrastructure/projects.repository';
import { ProjectsController } from './presentation/projects.controller';

@Module({
  imports: [
    UsersModule,
    OrganizationsModule,
    NotificationsModule,
    AuditModule,
    ActivitiesModule,
    AttachmentsModule,
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectsRepository,
    ProjectsService,
    {
      provide: PROJECT_DEMO_GATEWAY,
      useExisting: ProjectsRepository,
    },
  ],
  exports: [ProjectsRepository, ProjectsService, PROJECT_DEMO_GATEWAY],
})
export class ProjectsModule {}
