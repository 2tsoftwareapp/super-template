import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {  AppError, ERROR_CODES , SYSTEM_SCOPE } from '@repo/api-core';

import { AuditService } from '../../../audit/application/audit.service';
import {
  OBJECT_STORAGE,
  type ObjectStorage,
} from '../../../storage/application/object-storage.interface';
import { FILES_REPOSITORY, type FilesRepositoryPort } from '../ports/files.repository.port';
import { FileAccessService } from '../services/file-access.service';

@Injectable()
export class DeleteFileUseCase {
  constructor(
    private readonly fileAccessService: FileAccessService,
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly auditService: AuditService,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    fileId: string,
    requestContext?: RequestContext,
  ) {
    const file = await this.fileAccessService.findAccessibleFile(
      actor,
      fileId,
    );

    try {
      await this.objectStorage.delete(file.storageKey);
    } catch {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'File storage cleanup failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.filesRepository.softDelete(file.id);

    await this.auditService.log({
      actorId: actor.userId,
      action: 'file.deleted',
      entityType: 'file',
      entityId: file.id,
      requestContext,
      ...(file.organizationId ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: file.organizationId } : { scope: SYSTEM_SCOPE.PLATFORM })
    });
  }
}
