import type { Pool } from "pg";

import {
  type DynamicModule,
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
} from "@nestjs/common";
import {
  ADVISORY_LOCK_PORT,
  type DatabaseRuntimeOptions,
  type OrganizationModelOptions,
  PLATFORM_TRANSACTION_PORT,
  TenantContextService,
  TRANSACTION_PORT,
} from "@repo/api-kernel";

import { DatabaseRlsGuard } from "./database-rls.guard";
import {
  ADVISORY_LOCK_POOL,
  DATABASE_POOL,
  DATABASE_READ_REPLICA_POOL,
  DATABASE_RUNTIME_OPTIONS,
  DATABASE_SCHEMA,
  databaseProviders,
  DEFAULT_DATABASE_RUNTIME_OPTIONS,
  ORGANIZATION_MODEL_OPTIONS,
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
   * `composeFeatures` in `@repo/api-plugin-kit`). The runtime options are
   * derived from the same graph and must be passed by every application host.
   */
  static forRoot(options: {
    schema: Record<string, unknown>;
    options?: DatabaseRuntimeOptions;
    organizationModel?: OrganizationModelOptions;
  }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        { provide: DATABASE_SCHEMA, useValue: options.schema },
        {
          provide: DATABASE_RUNTIME_OPTIONS,
          useValue: options.options ?? DEFAULT_DATABASE_RUNTIME_OPTIONS,
        },
        {
          provide: ORGANIZATION_MODEL_OPTIONS,
          useValue: options.organizationModel ?? { organizationModel: "personal-orgs" },
        },
      ],
      exports: [DATABASE_SCHEMA, DATABASE_RUNTIME_OPTIONS, ORGANIZATION_MODEL_OPTIONS],
    };
  }

  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(DATABASE_READ_REPLICA_POOL) private readonly replicaPool: Pool | undefined,
    @Inject(ADVISORY_LOCK_POOL) private readonly advisoryLockPool: Pool,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([this.pool.end(), this.replicaPool?.end(), this.advisoryLockPool.end()]);
  }
}
