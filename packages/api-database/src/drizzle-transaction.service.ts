import type { TenantContext, TransactionExecutor, TransactionPort } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import type { DatabaseClient } from './database.types';

import { DATABASE } from './database.provider';
import { withTenantContext } from './tenant-context';
import { runInTransaction } from './transaction';

@Injectable()
export class DrizzleTransactionService implements TransactionPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async run<T>(fn: (executor: TransactionExecutor) => Promise<T>): Promise<T> {
    return runInTransaction(this.database, (tx) => fn(tx as TransactionExecutor));
  }

  async withTenant<T>(ctx: TenantContext, fn: (executor: TransactionExecutor) => Promise<T>): Promise<T> {
    return withTenantContext(this.database, ctx, (tx) => fn(tx as TransactionExecutor));
  }

  async withSavepoint<T>(executor: TransactionExecutor, name: string, fn: () => Promise<T>): Promise<T> {
    const tx = executor as any;
    if (typeof tx.execute !== 'function') {
      throw new Error('TransactionExecutor does not support savepoints in the current implementation');
    }
    
    const { sql } = await import('drizzle-orm');
    try {
      await tx.execute(sql.raw(`SAVEPOINT ${name}`));
      const result = await fn();
      await tx.execute(sql.raw(`RELEASE SAVEPOINT ${name}`));
      return result;
    } catch (error) {
      await tx.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${name}`));
      throw error;
    }
  }
}
