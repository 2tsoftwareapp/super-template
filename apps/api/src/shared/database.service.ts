import type { Database } from "@lean/db";

import { Global, Injectable, Module, type OnModuleDestroy } from "@nestjs/common";
import { loadEnv } from "@lean/config";
import { createDatabase } from "@lean/db";

type Pool = ReturnType<typeof createDatabase>["pool"];

/** One pool for the process; every repository reads through this service. */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  readonly db: Database;
  private readonly pool: Pool;

  constructor() {
    const created = createDatabase(loadEnv().DATABASE_URL);
    this.db = created.db;
    this.pool = created.pool;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({ providers: [DatabaseService], exports: [DatabaseService] })
export class DatabaseModule {}
