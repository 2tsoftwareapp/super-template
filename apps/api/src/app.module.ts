import { Module } from "@nestjs/common";

import { AuthModule } from "./modules/auth/auth.module";
import { FilesModule } from "./modules/files/files.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { MailModule } from "./modules/mail/mail.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { UsersModule } from "./modules/users/users.module";
import { DatabaseModule } from "./shared/database.service";
import { StorageModule } from "./shared/storage/storage.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    DatabaseModule,
    StorageModule,
    AuthModule,
    UsersModule,
    FilesModule,
    JobsModule,
    NotificationsModule,
    MailModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
