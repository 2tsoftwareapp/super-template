import type { PlatformTransactionPort, TransactionExecutor } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import type { DatabaseClient } from './database.types';

import { DATABASE } from './database.provider';
import { toSavepointExecutor } from './savepoint-executor';
import { withTenantContext } from './tenant-context';

@Injectable()
export class DrizzlePlatformTransactionService implements PlatformTransactionPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async run<T>(fn: (executor: TransactionExecutor) => Promise<T>): Promise<T> {
    return withTenantContext(
      this.database,
      {
        tenantId: '',
        userId: '',
        bypassRls: true,
      },
      (tx) => fn(tx as TransactionExecutor),
    );
  }

  async withSavepoint<T>(executor: TransactionExecutor, name: string, fn: () => Promise<T>): Promise<T> {
    const tx = toSavepointExecutor(executor);

    const { sql } = await import('drizzle-orm');
    try {
      await tx.execute(sql.raw(`SAVEPOINT ${name}`));
      const result = await fn();
      await tx.execute(sql.raw(`RELEASE SAVEPOINT ${name}`));
      return result;
    } catch (error) {
      await tx.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${name}`));
      await tx.execute(sql.raw(`RELEASE SAVEPOINT ${name}`));
      throw error;
    }
  }
}
