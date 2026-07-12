import { Module } from '@nestjs/common';
import { ENTITY_ATTACHMENT_LISTING } from '@repo/api-core';

import { AuditModule } from '../audit/audit.module';
import { FilesModule } from '../files/files.module';
import { AttachFileUseCase } from './application/use-cases/attach-file.use-case';
import { DeleteAttachmentUseCase } from './application/use-cases/delete-attachment.use-case';
import { ListAttachmentsUseCase } from './application/use-cases/list-attachments.use-case';
import { AttachmentsRepository } from './infrastructure/attachments.repository';
import { AttachmentsController } from './presentation/attachments.controller';

@Module({
  imports: [FilesModule, AuditModule],
  controllers: [AttachmentsController],
  providers: [
    AttachmentsRepository,
    AttachFileUseCase,
    ListAttachmentsUseCase,
    DeleteAttachmentUseCase,
    {
      provide: ENTITY_ATTACHMENT_LISTING,
      useExisting: AttachmentsRepository,
    },
  ],
  exports: [
    AttachmentsRepository,
    ENTITY_ATTACHMENT_LISTING,
  ],
})
export class AttachmentsModule {}
