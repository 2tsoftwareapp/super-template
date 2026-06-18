import { Module } from '@nestjs/common';

export { WorkspacePortsModule } from './workspace-ports.module';

import { ActivitiesModule } from './modules/activities/activities.module';
import { CommentsModule } from './modules/comments/comments.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { WorkspacePortsModule } from './workspace-ports.module';

@Module({
  imports: [
    WorkspacePortsModule,
    ActivitiesModule,
    CommentsModule,
    NotificationsModule,
    ProjectsModule,
    InvitationsModule,
  ],
  exports: [
    WorkspacePortsModule,
    ActivitiesModule,
    CommentsModule,
    NotificationsModule,
    ProjectsModule,
    InvitationsModule,
  ],
})
export class WorkspaceModule {}
