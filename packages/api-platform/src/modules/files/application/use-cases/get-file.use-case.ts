import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import { FilesMapper } from '../files.mapper';
import { FileAccessService } from '../services/file-access.service';

@Injectable()
export class GetFileUseCase {
  constructor(private readonly fileAccessService: FileAccessService) {}

  async execute(actor: AuthenticatedRequestUser, fileId: string) {
    const file = await this.fileAccessService.findAccessibleFile(
      actor,
      fileId,
    );

    return FilesMapper.toFileDto(file);
  }
}
