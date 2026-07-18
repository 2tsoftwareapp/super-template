import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  AppError, ERROR_CODES , ROLE_NAMES, FILE_KIND } from '@repo/api-core';
import type { AuthenticatedRequestUser } from '@repo/api-core';

import { FILES_REPOSITORY, type FilesRepositoryPort } from '../../../files/application/ports/files.repository.port';
import { OBJECT_STORAGE, type ObjectStorage } from '../../../storage/application/object-storage.interface';

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

    if (!file || file.kind !== FILE_KIND.AUDIT_EXPORT) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        'File not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);
    if (
      !isSuperAdmin &&
      file.organizationId !== actor.organizationId
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
