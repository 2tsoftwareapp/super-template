import { Module } from "@nestjs/common";

export { ImportExportAdapterRegistry } from "./import-export/import-export-adapter.registry";
export { ImportExportModule } from "./import-export/import-export.module";
export { DELIVERIES_REPOSITORY } from "./modules/notifications/application/ports/deliveries.repository.port";
export { PUSH_NOTIFIER } from "./modules/notifications/application/push.interface";
export { NotificationDeliveryProcessor } from "./modules/notifications/application/services/notification-delivery.processor";
export { NotificationDeliveryUseCase } from "./modules/notifications/application/use-cases/notification-delivery.use-case";
export { PlatformPortsModule } from "./platform-ports.module";

import { ActivitiesModule } from "./modules/activities/activities.module";
import { AttachmentsModule } from "./modules/attachments/attachments.module";
import { AuditModule } from "./modules/audit";
import { ExportsModule } from "./modules/exports/exports.module";
import { FilesModule } from "./modules/files/files.module";
import { ImportsModule } from "./modules/imports/imports.module";
import { JobsModule } from "./modules/jobs";
import { MailModule } from "./modules/mail";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { StorageModule } from "./modules/storage";
import { PlatformPortsModule } from "./platform-ports.module";

@Module({
  imports: [
    PlatformPortsModule,
    StorageModule,
    AuditModule,
    MailModule,
    SettingsModule,
    FilesModule,
    AttachmentsModule,
    JobsModule,
    ImportsModule,
    ExportsModule,
    NotificationsModule,
    ActivitiesModule,
  ],
  exports: [
    PlatformPortsModule,
    StorageModule,
    AuditModule,
    MailModule,
    SettingsModule,
    FilesModule,
    AttachmentsModule,
    JobsModule,
    ImportsModule,
    ExportsModule,
    NotificationsModule,
    ActivitiesModule,
  ],
})
export class PlatformModule {}
