import { Global, Module } from "@nestjs/common";
import { ENTITY_ATTACHMENT_LISTING } from "@repo/feature-upload/contracts";

import { FilesModule } from "../files/files.module";
import { ATTACHMENTS_REPOSITORY } from "./application/ports/attachments.repository.port";
import { AttachFileUseCase } from "./application/use-cases/attach-file.use-case";
import { DeleteAttachmentUseCase } from "./application/use-cases/delete-attachment.use-case";
import { ListAttachmentsUseCase } from "./application/use-cases/list-attachments.use-case";
import { AttachmentsRepository } from "./infrastructure/attachments.repository";
import { AttachmentsController } from "./presentation/attachments.controller";

@Global()
@Module({
  imports: [FilesModule],
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
    {
      provide: ATTACHMENTS_REPOSITORY,
      useExisting: AttachmentsRepository,
    },
  ],
  exports: [ATTACHMENTS_REPOSITORY, ENTITY_ATTACHMENT_LISTING],
})
export class AttachmentsModule {}
