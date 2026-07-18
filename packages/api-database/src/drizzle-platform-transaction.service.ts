import type { PlatformTransactionPort, TransactionExecutor } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import type { DatabaseClient } from './database.types';

import { DATABASE } from './database.provider';
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
}
