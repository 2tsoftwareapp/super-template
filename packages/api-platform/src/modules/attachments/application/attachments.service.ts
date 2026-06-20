import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import type {
  AttachEntityCommand,
  ListAttachmentsQuery,
} from './attachments.types';

import { AttachFileUseCase } from './use-cases/attach-file.use-case';
import { DeleteAttachmentUseCase } from './use-cases/delete-attachment.use-case';
import { ListAttachmentsUseCase } from './use-cases/list-attachments.use-case';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly attachFileUseCase: AttachFileUseCase,
    private readonly listAttachmentsUseCase: ListAttachmentsUseCase,
    private readonly deleteAttachmentUseCase: DeleteAttachmentUseCase,
  ) {}

  async attach(
    actor: AuthenticatedRequestUser,
    input: AttachEntityCommand,
    requestContext?: RequestContext,
  ) {
    return this.attachFileUseCase.execute(actor, input, requestContext);
  }

  async list(query: ListAttachmentsQuery) {
    return this.listAttachmentsUseCase.execute(query);
  }

  async delete(
    actor: AuthenticatedRequestUser,
    attachmentId: string,
    requestContext?: RequestContext,
  ) {
    return this.deleteAttachmentUseCase.execute(
      actor,
      attachmentId,
      requestContext,
    );
  }
}
