import type { Pool } from "pg";

import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { EnvironmentService } from "@repo/api-core";

import { DATABASE_POOL } from "./database.provider";

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
    private readonly environmentService: EnvironmentService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.environmentService.databaseSkipRlsCheck) {
      this.logger.warn(
        "DATABASE_SKIP_RLS_CHECK is enabled; skipping database RLS capability check",
      );
      return;
    }

    const result = await this.pool.query<RoleCapabilitiesRow>(`
      SELECT
        current_user AS "currentUser",
        rolsuper AS "isSuperuser",
        rolbypassrls AS "bypassesRls"
      FROM pg_roles
      WHERE rolname = current_user
    `);

    const capabilities = result.rows[0];

    if (!capabilities) {
      throw new Error("Database RLS guard could not resolve the current PostgreSQL role");
    }

    if (capabilities.isSuperuser || capabilities.bypassesRls) {
      throw new Error(
        `DATABASE_URL connects as "${capabilities.currentUser}", which bypasses row-level security ` +
          `(rolsuper=${capabilities.isSuperuser}, rolbypassrls=${capabilities.bypassesRls}). ` +
          "Use the restricted application role from migration 0007_app_database_role.sql " +
          "(for example fullstack_starter_app) for DATABASE_URL, and keep a privileged " +
          "DATABASE_MIGRATE_URL for migrations and db:reset.",
      );
    }

    this.logger.log(`Database RLS guard passed for restricted role "${capabilities.currentUser}"`);
  }
}
