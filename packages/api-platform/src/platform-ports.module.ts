import { Global, Module } from '@nestjs/common';

import { AuditModule } from './modules/audit/audit.module';
import { FilesModule } from './modules/files/files.module';
import { MailModule } from './modules/mail/mail.module';

@Global()
@Module({
  imports: [AuditModule, MailModule, FilesModule],
  exports: [AuditModule, MailModule, FilesModule],
})
export class PlatformPortsModule {}
