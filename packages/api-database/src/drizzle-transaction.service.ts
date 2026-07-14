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
}
