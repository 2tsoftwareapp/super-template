import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';
import type { AuthenticatedRequestUser } from '@repo/api-core';

import { FILES_REPOSITORY, type FilesRepositoryPort } from '../../../files/application/ports/files.repository.port';
import { OBJECT_STORAGE, type ObjectStorage } from '../../../storage/application/object-storage.interface';
import { canDownloadAuditExport } from '../../domain/audit-export-access.policy';

@Injectable()
export class DownloadAuditExportUseCase {
  constructor(
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    fileId: string,
  ): Promise<{ content: Buffer; originalName: string }> {
    const file = await this.filesRepository.findById(fileId);

    if (
      !file ||
      !canDownloadAuditExport({
        actorRoles: actor.roles,
        actorOrganizationId: actor.organizationId,
        fileKind: file.kind,
        fileOrganizationId: file.organizationId,
      })
    ) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        'File not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const content = await this.objectStorage.read(file.storageKey);

    return { content, originalName: file.originalName };
  }
}
