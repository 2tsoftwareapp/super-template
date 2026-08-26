import type { Pool } from "pg";

import { type DynamicModule, Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import {
  ADVISORY_LOCK_PORT,
  PLATFORM_TRANSACTION_PORT,
  TenantContextService,
  TRANSACTION_PORT,
} from "@repo/api-runtime";

import { DatabaseRlsGuard } from "./database-rls.guard";
import {
  ADVISORY_LOCK_POOL,
  DATABASE_POOL,
  DATABASE_SCHEMA,
  databaseProviders,
} from "./database.provider";
import { DrizzlePlatformTransactionService } from "./drizzle-platform-transaction.service";
import { DrizzleTransactionService } from "./drizzle-transaction.service";
import { PostgresAdvisoryLockService } from "./postgres-advisory-lock.service";

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
  /**
   * Compose the database runtime with an application-supplied schema. The schema
   * is the merged contribution of every enabled feature package (see
   * `composeFeatures` in `@repo/api-plugin-kit`). Omitting `forRoot` uses the
   * empty runtime default — the API host must always pass the composed schema.
   */
  static forRoot(options: { schema: Record<string, unknown> }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [{ provide: DATABASE_SCHEMA, useValue: options.schema }],
      exports: [DATABASE_SCHEMA],
    };
  }

  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(ADVISORY_LOCK_POOL) private readonly advisoryLockPool: Pool,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([this.pool.end(), this.advisoryLockPool.end()]);
  }
}
