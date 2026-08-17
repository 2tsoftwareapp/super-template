import { Global, Module } from "@nestjs/common";

import { ActivitiesModule } from "./modules/activities/activities.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { AuditModule } from "./modules/audit/audit.module";
import { FilesModule } from "./modules/files/files.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { MailModule } from "./modules/mail/mail.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SettingsModule } from "./modules/settings/settings.module";

@Global()
@Module({
  imports: [
    AuditModule,
    MailModule,
    FilesModule,
    AttachmentsModule,
    JobsModule,
    NotificationsModule,
    ActivitiesModule,
    SettingsModule,
  ],
  exports: [
    AuditModule,
    MailModule,
    FilesModule,
    AttachmentsModule,
    JobsModule,
    NotificationsModule,
    ActivitiesModule,
    SettingsModule,
  ],
})
export class PlatformPortsModule {}
