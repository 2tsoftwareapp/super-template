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

    // Savepoint names are PostgreSQL identifiers. A job id is a UUID containing
    // hyphens ("550e8400-e29b-..."), which is not a valid bare identifier, so
    // the name must be double-quoted (and any embedded quote escaped) to avoid
    // a syntax error. See H-002 (Feature 07 Round 5).
    const { sql } = await import('drizzle-orm');
    const escaped = name.replace(/"/g, '""');
    const identifier = `"${escaped}"`;
    try {
      await tx.execute(sql.raw(`SAVEPOINT ${identifier}`));
      const result = await fn();
      await tx.execute(sql.raw(`RELEASE SAVEPOINT ${identifier}`));
      return result;
    } catch (error) {
      await tx.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${identifier}`));
      await tx.execute(sql.raw(`RELEASE SAVEPOINT ${identifier}`));
      throw error;
    }
  }
}
