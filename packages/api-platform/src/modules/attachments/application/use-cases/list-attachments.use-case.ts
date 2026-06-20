import { Injectable } from '@nestjs/common';

import type { ListAttachmentsQuery } from '../attachments.types';

import { AttachmentsRepository } from '../../infrastructure/attachments.repository';
import { AttachmentsMapper } from '../attachments.mapper';

@Injectable()
export class ListAttachmentsUseCase {
  constructor(
    private readonly attachmentsRepository: AttachmentsRepository,
  ) {}

  async execute(query: ListAttachmentsQuery) {
    const rows = await this.attachmentsRepository.listByEntity(
      query.entityType,
      query.entityId,
    );

    return rows.map((row) => AttachmentsMapper.toAttachmentDto(row));
  }
}
