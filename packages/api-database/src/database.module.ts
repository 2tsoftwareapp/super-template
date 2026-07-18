import type { Pool } from 'pg';

import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { ADVISORY_LOCK_PORT, PLATFORM_TRANSACTION_PORT, TenantContextService, TRANSACTION_PORT } from '@repo/api-core';

import { DatabaseRlsGuard } from './database-rls.guard';
import { DATABASE_POOL, databaseProviders } from './database.provider';
import { DrizzlePlatformTransactionService } from './drizzle-platform-transaction.service';
import { DrizzleTransactionService } from './drizzle-transaction.service';
import { PostgresAdvisoryLockService } from './postgres-advisory-lock.service';

@Global()
@Module({
  providers: [
    ...databaseProviders,
    TenantContextService,
    DatabaseRlsGuard,
    DrizzleTransactionService,
    { provide: TRANSACTION_PORT, useExisting: DrizzleTransactionService },
    DrizzlePlatformTransactionService,
    { provide: PLATFORM_TRANSACTION_PORT, useExisting: DrizzlePlatformTransactionService },
    PostgresAdvisoryLockService,
    { provide: ADVISORY_LOCK_PORT, useExisting: PostgresAdvisoryLockService },
  ],
  exports: [
    ...databaseProviders,
    TenantContextService,
    DrizzleTransactionService,
    TRANSACTION_PORT,
    DrizzlePlatformTransactionService,
    PLATFORM_TRANSACTION_PORT,
    PostgresAdvisoryLockService,
    ADVISORY_LOCK_PORT,
  ],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
