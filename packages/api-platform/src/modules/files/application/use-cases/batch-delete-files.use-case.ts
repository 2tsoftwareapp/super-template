import type {
  AuthenticatedRequestUser,
  JsonObject,
  RequestContext,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { requireOrganizationId } from '@repo/api-core';

import { FILES_REPOSITORY, type FilesRepositoryPort } from '../ports/files.repository.port';
import { DeleteFileUseCase } from './delete-file.use-case';

export interface BatchDeleteResultItem {
  fileId: string;
  success: boolean;
  error: string | null;
}

@Injectable()
export class BatchDeleteFilesUseCase {
  constructor(
    @Inject(FILES_REPOSITORY) private readonly filesRepository: FilesRepositoryPort,
    private readonly deleteFileUseCase: DeleteFileUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    fileIds: string[],
    idempotencyKey: string | undefined,
    requestContext?: RequestContext,
  ): Promise<BatchDeleteResultItem[]> {
    if (idempotencyKey) {
      const existing =
        await this.filesRepository.findBatchOperationByIdempotencyKey(
          actor.userId,
          idempotencyKey,
        );

      if (existing) {
        return existing.results as unknown as BatchDeleteResultItem[];
      }
    }

    const results: BatchDeleteResultItem[] = [];

    for (const fileId of fileIds) {
      try {
        await this.deleteFileUseCase.execute(actor, fileId, requestContext);
        results.push({ fileId, success: true, error: null });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Delete failed';
        results.push({ fileId, success: false, error: message });
      }
    }

    await this.filesRepository.createBatchOperation({
      organizationId: requireOrganizationId(actor),
      actorId: actor.userId,
      operation: 'delete',
      idempotencyKey: idempotencyKey ?? null,
      results: results as unknown as JsonObject[],
    });

    return results;
  }
}
