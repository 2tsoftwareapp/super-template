import { Global, Module } from '@nestjs/common';

import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Global()
@Module({
  imports: [NotificationsModule, ProjectsModule],
  exports: [NotificationsModule, ProjectsModule],
})
export class WorkspacePortsModule {}
