import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { AttachmentsService } from './application/attachments.service';
import { AttachmentsRepository } from './infrastructure/attachments.repository';
import { AttachmentsController } from './presentation/attachments.controller';

@Module({
  imports: [FilesModule, AuditModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsRepository, AttachmentsService],
  exports: [AttachmentsRepository, AttachmentsService],
})
export class AttachmentsModule {}
