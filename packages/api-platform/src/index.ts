import { Module } from '@nestjs/common';

export { PlatformPortsModule } from './platform-ports.module';

import { AttachmentsModule } from './modules/attachments/attachments.module';
import { AuditModule } from './modules/audit/audit.module';
import { ExportsModule } from './modules/exports/exports.module';
import { FilesModule } from './modules/files/files.module';
import { ImportsModule } from './modules/imports/imports.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StorageModule } from './modules/storage/storage.module';
import { PlatformPortsModule } from './platform-ports.module';

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
  ],
})
export class PlatformModule {}
