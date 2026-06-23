import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import { FilesRepository } from '../../infrastructure/files.repository';
import { FileAccessService } from '../services/file-access.service';

@Injectable()
export class ListFileVersionsUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    private readonly filesRepository: FilesRepository,
  ) {}

  async execute(actor: AuthenticatedRequestUser, fileId: string) {
    const file = await this.fileAccessService.findAccessibleFile(
      actor,
      fileId,
    );
    const versions = await this.filesRepository.listVersions(file.id);

    return versions.map((version) => ({
      id: version.id,
      fileId: version.fileId,
      versionNumber: version.versionNumber,
      storageKey: version.storageKey,
      mimeType: version.mimeType,
      sizeBytes: version.sizeBytes,
      checksum: version.checksum,
      createdById: version.createdById,
      createdAt: version.createdAt.toISOString(),
    }));
  }
}
