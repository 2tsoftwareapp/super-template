import type { Database, Executor } from "@lean/db";

import { AsyncLocalStorage } from "node:async_hooks";

import { Global, Injectable, Module, type OnModuleDestroy } from "@nestjs/common";
import { loadEnv } from "@lean/config";
import { createDatabase } from "@lean/db";

type Pool = ReturnType<typeof createDatabase>["pool"];

/** One pool for the process; every repository reads through this service. */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly root: Database;
  private readonly pool: Pool;
  private readonly scope = new AsyncLocalStorage<Executor>();

  constructor() {
    const created = createDatabase(loadEnv().DATABASE_URL);
    this.root = created.db;
    this.pool = created.pool;
  }

  /** The open transaction when called inside `transaction()`, the pool otherwise. */
  get db(): Executor {
    return this.scope.getStore() ?? this.root;
  }

  /** Every repository call made inside `work` joins one transaction; nesting reuses it. */
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.scope.getStore()) {
      return work();
    }

    return this.root.transaction((tx) => this.scope.run(tx, work));
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({ providers: [DatabaseService], exports: [DatabaseService] })
export class DatabaseModule {}
