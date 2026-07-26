import type { TransactionExecutor } from '@repo/api-core';
import { DrizzleTransactionService } from '@repo/api-database';
import { describe, expect, it, vi } from 'vitest';

describe('DrizzleTransactionService', () => {
  it('run() passes executor to callback', async () => {
    const tx = Symbol('tx');
    const database = { transaction: vi.fn().mockImplementation(
      (fn: (tx: unknown) => unknown) => fn(tx),
    ) };
    const tenantContextService = { get: () => undefined };
    const service = new DrizzleTransactionService(database as never, tenantContextService as never);

    const result = await service.run((executor) => {
      expect(executor).toBe(tx as unknown as TransactionExecutor);
      return Promise.resolve('done');
    });

    expect(result).toBe('done');
    expect(database.transaction).toHaveBeenCalledOnce();
  });

  it('run() re-throws callback errors', async () => {
    const database = { transaction: vi.fn().mockImplementation(
      (fn: (tx: unknown) => unknown) => fn({}),
    ) };
    const tenantContextService = { get: () => undefined };
    const service = new DrizzleTransactionService(database as never, tenantContextService as never);
    const error = new Error('test error');

    await expect(
      service.run(() => Promise.reject(error)),
    ).rejects.toThrow(error);
  });
});
