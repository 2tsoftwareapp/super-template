import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { canAccessFile } from '../../domain/file-access.policy';
import { FILES_REPOSITORY, type FilesRepositoryPort } from '../ports/files.repository.port';

@Injectable()
export class FileAccessService {
  constructor(
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
  ) {}

  async findAccessibleFile(actor: AuthenticatedRequestUser, fileId: string) {
    const file = await this.filesRepository.findById(fileId);

    if (!file) {
      throw new AppError(
        ERROR_CODES.FILE_NOT_FOUND,
        'File not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      !canAccessFile({
        actor: {
          userId: actor.userId,
          organizationId: actor.organizationId,
          roles: actor.roles,
          permissions: actor.permissions,
        },
        file: {
          organizationId: file.organizationId,
          uploadedById: file.uploadedById,
          kind: file.kind,
          visibility: file.visibility,
        },
      })
    ) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You do not have access to this file',
        HttpStatus.FORBIDDEN,
      );
    }

    return file;
  }
}
