import { Module } from '@nestjs/common';
import { ActivitiesModule } from './modules/activities/activities.module';
import { CommentsModule } from './modules/comments/comments.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProjectsModule } from './modules/projects/projects.module';

@Module({
  imports: [
    ActivitiesModule,
    CommentsModule,
    NotificationsModule,
    ProjectsModule,
    InvitationsModule,
  ],
  exports: [
    ActivitiesModule,
    CommentsModule,
    NotificationsModule,
    ProjectsModule,
    InvitationsModule,
  ],
})
export class WorkspaceModule {}
