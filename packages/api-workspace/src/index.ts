import { Module } from '@nestjs/common';
export { ActivitiesModule } from './modules/activities/activities.module';
export { ActivitiesService } from './modules/activities/application/activities.service';
export { CommentsModule } from './modules/comments/comments.module';
export { CommentsService } from './modules/comments/application/comments.service';
export { InvitationsModule } from './modules/invitations/invitations.module';
export { InvitationsService } from './modules/invitations/application/invitations.service';
export { NotificationsModule } from './modules/notifications/notifications.module';
export { NotificationsService } from './modules/notifications/application/notifications.service';
export { NotificationJobsRepository } from './modules/notifications/infrastructure/notification-jobs.repository';
export { NotificationJobsProcessor } from './modules/notifications/application/notification-jobs.processor';
export { NotificationsRepository } from './modules/notifications/infrastructure/notifications.repository';
export { ProjectsModule } from './modules/projects/projects.module';
export { ProjectsService } from './modules/projects/application/projects.service';
export { ProjectsRepository } from './modules/projects/infrastructure/projects.repository';
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
