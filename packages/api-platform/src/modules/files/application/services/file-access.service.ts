import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {   ACTION, AppError, ERROR_CODES, perm , FILE_KIND , ROLE_NAMES, FILE_VISIBILITY } from '@repo/api-core';

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
      file.organizationId !== actor.organizationId &&
      !actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)
    ) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You do not have access to this file',
        HttpStatus.FORBIDDEN,
      );
    }

    if (file.kind === FILE_KIND.AUDIT_EXPORT || file.visibility === FILE_VISIBILITY.RESTRICTED) {
      const hasAuditPermission = actor.permissions.includes(perm('audit', ACTION.READ));
      if (!hasAuditPermission && !actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          'You do not have permission to access restricted files',
          HttpStatus.FORBIDDEN,
        );
      }
      return file;
    }

    if (
      file.uploadedById !== actor.userId &&
      !actor.roles.includes('ADMIN') &&
      !actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)
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
