import { Module } from '@nestjs/common';
import { AuditModule } from './modules/audit/audit.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { ExportsModule } from './modules/exports/exports.module';
import { FilesModule } from './modules/files/files.module';
import { ImportsModule } from './modules/imports/imports.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
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
