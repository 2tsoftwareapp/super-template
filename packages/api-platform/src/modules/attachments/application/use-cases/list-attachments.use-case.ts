import { Inject, Injectable } from "@nestjs/common";

import type { ListAttachmentsQuery } from "../attachments.types";

import { AttachmentsMapper } from "../attachments.mapper";
import {
  ATTACHMENTS_REPOSITORY,
  type AttachmentsRepositoryPort,
} from "../ports/attachments.repository.port";

@Injectable()
export class ListAttachmentsUseCase {
  constructor(
    @Inject(ATTACHMENTS_REPOSITORY)
    private readonly attachmentsRepository: AttachmentsRepositoryPort,
  ) {}

  async execute(query: ListAttachmentsQuery) {
    const rows = await this.attachmentsRepository.listByEntity(query.entityType, query.entityId);

    return rows.map((row) => AttachmentsMapper.toAttachmentDto(row));
  }
}
