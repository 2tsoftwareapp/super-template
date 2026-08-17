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

    const runDeletes = async (): Promise<BatchDeleteResultItem[]> => {
      const results: BatchDeleteResultItem[] = [];

      for (const fileId of fileIds) {
        try {
          await this.deleteFileUseCase.execute(actor, fileId, requestContext);
          results.push({ fileId, success: true, error: null });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Delete failed';
          results.push({ fileId, success: false, error: message });
        }
      }

      return results;
    };

    const persist = async (results: BatchDeleteResultItem[]) =>
      this.filesRepository.createBatchOperation({
        organizationId: requireOrganizationId(actor),
        actorId: actor.userId,
        operation: 'delete',
        idempotencyKey: idempotencyKey ?? null,
        results: results as unknown as JsonObject[],
      });

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

    // Atomic idempotency: with a key, insert races are absorbed by the
    // repository (unique violation -> fetch the concurrent record) instead of
    // surfacing a 500. Without a key there is no conflict surface (the partial
    // unique index only covers non-null keys).
    if (idempotencyKey) {
      const persisted = await this.filesRepository.createBatchOperationIdempotent(
        {
          organizationId: requireOrganizationId(actor),
          actorId: actor.userId,
          operation: 'delete',
          idempotencyKey,
        },
        async () => (await runDeletes()) as unknown as JsonObject[],
      );

      return (persisted as unknown as BatchDeleteResultItem[] | null) ??
        (await runDeletes());
    }

    const results = await runDeletes();
    await persist(results);

    return results;
  }
}
