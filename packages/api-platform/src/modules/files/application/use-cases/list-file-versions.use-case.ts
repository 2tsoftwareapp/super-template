import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import { FILES_REPOSITORY, type FilesRepositoryPort } from '../ports/files.repository.port';
import { FileAccessService } from '../services/file-access.service';

@Injectable()
export class ListFileVersionsUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
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
