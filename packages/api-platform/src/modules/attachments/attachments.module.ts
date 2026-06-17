import { Module } from '@nestjs/common';
import { ENTITY_ATTACHMENT_LISTING } from '@repo/api-core';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { AttachmentsService } from './application/attachments.service';
import { AttachmentsRepository } from './infrastructure/attachments.repository';
import { AttachmentsController } from './presentation/attachments.controller';

@Module({
  imports: [FilesModule, AuditModule],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsRepository,
    AttachmentsService,
    {
      provide: ENTITY_ATTACHMENT_LISTING,
      useExisting: AttachmentsRepository,
    },
  ],
  exports: [
    AttachmentsRepository,
    AttachmentsService,
    ENTITY_ATTACHMENT_LISTING,
  ],
})
export class AttachmentsModule {}
