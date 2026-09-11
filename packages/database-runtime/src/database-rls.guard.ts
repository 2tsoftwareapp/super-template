import type { Pool } from "pg";

import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { DATABASE_RUNTIME_ENV, type DatabaseRuntimeEnv } from "@repo/api-kernel";

import {
  DATABASE_POOL,
  DATABASE_READ_REPLICA_POOL,
  DATABASE_RUNTIME_OPTIONS,
} from "./database.provider";

interface RoleCapabilitiesRow {
  currentUser: string;
  isSuperuser: boolean;
  bypassesRls: boolean;
}

@Injectable()
export class DatabaseRlsGuard implements OnModuleInit {
  private readonly logger = new Logger(DatabaseRlsGuard.name);

  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(DATABASE_READ_REPLICA_POOL) private readonly replicaPool: Pool | undefined,
    @Inject(DATABASE_RUNTIME_ENV) private readonly databaseEnv: DatabaseRuntimeEnv,
    @Inject(DATABASE_RUNTIME_OPTIONS)
    private readonly databaseOptions: { readReplica: boolean },
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.databaseEnv.databaseSkipRlsCheck) {
      this.logger.warn(
        "DATABASE_SKIP_RLS_CHECK is enabled; skipping database RLS capability check",
      );
      return;
    }

    await this.assertRestrictedRole(this.pool, "DATABASE_URL");
    if (this.databaseOptions.readReplica && !this.replicaPool) {
      throw new Error(
        "DATABASE_URL_READ_REPLICA is required when database-read-replica capability is enabled.",
      );
    }
    if (this.replicaPool) {
      await this.assertRestrictedRole(this.replicaPool, "DATABASE_URL_READ_REPLICA");
    }
  }

  private async assertRestrictedRole(pool: Pool, connectionName: string): Promise<void> {
    const result = await pool.query<RoleCapabilitiesRow>(`
      SELECT
        current_user AS "currentUser",
        rolsuper AS "isSuperuser",
        rolbypassrls AS "bypassesRls"
      FROM pg_roles
      WHERE rolname = current_user
    `);

    const capabilities = result.rows[0];

    if (!capabilities) {
      throw new Error(
        `Database RLS guard could not resolve the current PostgreSQL role for ${connectionName}`,
      );
    }

    if (capabilities.isSuperuser || capabilities.bypassesRls) {
      throw new Error(
        `${connectionName} connects as "${capabilities.currentUser}", which bypasses row-level security ` +
          `(rolsuper=${capabilities.isSuperuser}, rolbypassrls=${capabilities.bypassesRls}). ` +
          "Use the restricted application role from migration 0007_app_database_role.sql " +
          `(for example fullstack_starter_app) for ${connectionName}, and keep a privileged ` +
          "DATABASE_MIGRATE_URL for migrations and db:reset.",
      );
    }

    this.logger.log(
      `Database RLS guard passed for ${connectionName} restricted role "${capabilities.currentUser}"`,
    );
  }
}
