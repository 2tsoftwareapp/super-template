import type { Pool } from 'pg';

import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { TenantContextService, TRANSACTION_PORT } from '@repo/api-core';

import { DatabaseRlsGuard } from './database-rls.guard';
import { DATABASE_POOL, databaseProviders } from './database.provider';
import { DrizzleTransactionService } from './drizzle-transaction.service';

@Global()
@Module({
  providers: [
    ...databaseProviders,
    TenantContextService,
    DatabaseRlsGuard,
    DrizzleTransactionService,
    { provide: TRANSACTION_PORT, useExisting: DrizzleTransactionService },
  ],
  exports: [...databaseProviders, TenantContextService, DrizzleTransactionService, TRANSACTION_PORT],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
