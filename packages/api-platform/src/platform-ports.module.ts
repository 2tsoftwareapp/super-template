import { Global, Module } from '@nestjs/common';

import { AttachmentsModule } from './modules/attachments/attachments.module';
import { AuditModule } from './modules/audit/audit.module';
import { FilesModule } from './modules/files/files.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';

@Global()
@Module({
  imports: [AuditModule, MailModule, FilesModule, AttachmentsModule, JobsModule],
  exports: [AuditModule, MailModule, FilesModule, AttachmentsModule, JobsModule],
})
export class PlatformPortsModule {}
