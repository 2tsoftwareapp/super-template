import { Module } from '@nestjs/common';
export { AuditModule } from './modules/audit/audit.module';
export { AuditService } from './modules/audit/application/audit.service';
export { AttachmentsModule } from './modules/attachments/attachments.module';
export { AttachmentsRepository } from './modules/attachments/infrastructure/attachments.repository';
export { ExportsModule } from './modules/exports/exports.module';
export { ExportsService } from './modules/exports/application/exports.service';
export { FilesModule } from './modules/files/files.module';
export { FilesService } from './modules/files/application/files.service';
export { ImportsModule } from './modules/imports/imports.module';
export { ImportsService } from './modules/imports/application/imports.service';
export { JobsModule } from './modules/jobs/jobs.module';
export { JobsService } from './modules/jobs/application/jobs.service';
export { MailModule } from './modules/mail/mail.module';
export { MailService } from './modules/mail/application/mail.service';
export { SettingsModule } from './modules/settings/settings.module';
export { SettingsService } from './modules/settings/application/settings.service';
export { StorageModule } from './modules/storage/storage.module';
export { ObjectStorage } from './modules/storage/application/object-storage.interface';
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
