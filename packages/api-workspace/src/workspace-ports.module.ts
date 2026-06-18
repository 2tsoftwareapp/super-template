import { Global, Module } from '@nestjs/common';

import { ActivitiesModule } from './modules/activities/activities.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Global()
@Module({
  imports: [NotificationsModule, ProjectsModule, ActivitiesModule],
  exports: [NotificationsModule, ProjectsModule, ActivitiesModule],
})
export class WorkspacePortsModule {}
