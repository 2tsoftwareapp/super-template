import { Module } from '@nestjs/common';
export { ActivitiesModule } from './modules/activities/activities.module';
export { ActivitiesService } from './modules/activities/application/activities.service';
export { CommentsService } from './modules/comments/application/comments.service';
export { CommentsModule } from './modules/comments/comments.module';
export { InvitationsService } from './modules/invitations/application/invitations.service';
export { InvitationsModule } from './modules/invitations/invitations.module';
export { NotificationJobsProcessor } from './modules/notifications/application/notification-jobs.processor';
export { NotificationsService } from './modules/notifications/application/notifications.service';
export { NotificationJobsRepository } from './modules/notifications/infrastructure/notification-jobs.repository';
export { NotificationsRepository } from './modules/notifications/infrastructure/notifications.repository';
export { NotificationsModule } from './modules/notifications/notifications.module';
export { ProjectsService } from './modules/projects/application/projects.service';
export { ProjectsRepository } from './modules/projects/infrastructure/projects.repository';
export { ProjectsModule } from './modules/projects/projects.module';
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
