import { describe, expect, it, vi } from 'vitest';

import { BatchDeleteFilesUseCase } from '../batch-delete-files.use-case';

const actor = {
  userId: 'user-1',
  sessionId: 'session-1',
  email: 'admin@example.local',
  displayName: 'Admin',
  status: 'ACTIVE' as const,
  roles: ['ADMIN'],
  permissions: [],
  organizationId: 'org-1',
};

describe('BatchDeleteFilesUseCase', () => {
  it('deletes each file and records a per-item result', async () => {
    const filesRepository = {
      findBatchOperationByIdempotencyKey: vi.fn(async () => null),
      createBatchOperation: vi.fn(async () => ({ id: 'op-1' })),
    };
    const deleteFileUseCase = { execute: vi.fn(async () => undefined) };

    const useCase = new BatchDeleteFilesUseCase(
      filesRepository as never,
      deleteFileUseCase as never,
    );

    const results = await useCase.execute(
      actor,
      ['file-1', 'file-2'],
      undefined,
    );

    expect(deleteFileUseCase.execute).toHaveBeenCalledTimes(2);
    expect(results).toEqual([
      { fileId: 'file-1', success: true, error: null },
      { fileId: 'file-2', success: true, error: null },
    ]);
    expect(filesRepository.createBatchOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        actorId: 'user-1',
        operation: 'delete',
        idempotencyKey: null,
      }),
    );
  });

  it('captures per-item failures without aborting the rest of the batch', async () => {
    const filesRepository = {
      findBatchOperationByIdempotencyKey: vi.fn(async () => null),
      createBatchOperation: vi.fn(async () => ({ id: 'op-1' })),
    };
    const deleteFileUseCase = {
      execute: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('File not found')),
    };

    const useCase = new BatchDeleteFilesUseCase(
      filesRepository as never,
      deleteFileUseCase as never,
    );

    const results = await useCase.execute(
      actor,
      ['file-1', 'file-2'],
      undefined,
    );

    expect(results).toEqual([
      { fileId: 'file-1', success: true, error: null },
      { fileId: 'file-2', success: false, error: 'File not found' },
    ]);
  });

  it('delegates race absorption to the repository idempotent insert and returns its result', async () => {
    const storedResults = [
      { fileId: 'file-1', success: true, error: null },
    ];
    const filesRepository = {
      findBatchOperationByIdempotencyKey: vi.fn(async () => null),
      createBatchOperation: vi.fn(),
      createBatchOperationIdempotent: vi.fn(
        async (_input, computeResults: () => Promise<unknown>) => {
          await computeResults();
          return storedResults;
        },
      ),
    };
    const deleteFileUseCase = { execute: vi.fn(async () => undefined) };

    const useCase = new BatchDeleteFilesUseCase(
      filesRepository as never,
      deleteFileUseCase as never,
    );

    const results = await useCase.execute(actor, ['file-1'], 'race-key');

    // The compute callback runs the deletes; the repository owns the
    // unique-violation retry and returns the concurrent record's results.
    expect(deleteFileUseCase.execute).toHaveBeenCalledTimes(1);
    expect(filesRepository.createBatchOperationIdempotent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        actorId: 'user-1',
        operation: 'delete',
        idempotencyKey: 'race-key',
      }),
      expect.any(Function),
    );
    expect(results).toBe(storedResults);
  });

  it('re-runs deletes when the repository reports no persisted results', async () => {
    const filesRepository = {
      findBatchOperationByIdempotencyKey: vi.fn(async () => null),
      createBatchOperationIdempotent: vi.fn(async () => null),
    };
    const deleteFileUseCase = { execute: vi.fn(async () => undefined) };

    const useCase = new BatchDeleteFilesUseCase(
      filesRepository as never,
      deleteFileUseCase as never,
    );

    const results = await useCase.execute(actor, ['file-1'], 'race-key');

    expect(deleteFileUseCase.execute).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      { fileId: 'file-1', success: true, error: null },
    ]);
  });

  it('replays the stored result instead of re-deleting when the idempotency key matches', async () => {
    const storedResults = [
      { fileId: 'file-1', success: true, error: null },
    ];
    const filesRepository = {
      findBatchOperationByIdempotencyKey: vi.fn(async () => ({
        id: 'op-1',
        results: storedResults,
      })),
      createBatchOperation: vi.fn(),
    };
    const deleteFileUseCase = { execute: vi.fn() };

    const useCase = new BatchDeleteFilesUseCase(
      filesRepository as never,
      deleteFileUseCase as never,
    );

    const results = await useCase.execute(actor, ['file-1'], 'replay-key');

    expect(results).toBe(storedResults);
    expect(deleteFileUseCase.execute).not.toHaveBeenCalled();
    expect(filesRepository.createBatchOperation).not.toHaveBeenCalled();
    expect(filesRepository.findBatchOperationByIdempotencyKey).toHaveBeenCalledWith(
      'user-1',
      'replay-key',
    );
  });
});
