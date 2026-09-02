import type { TenantContext, TransactionExecutor, TransactionPort } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { TenantContextService } from "@repo/api-runtime";
import { sql } from "drizzle-orm";

import type { DatabaseClient } from "./database.types";

import { DATABASE } from "./database.provider";
import { toSavepointExecutor } from "./savepoint-executor";
import { withTenantContext } from "./tenant-context";
import { runInTransaction } from "./transaction";

@Injectable()
export class DrizzleTransactionService implements TransactionPort {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async run<T>(fn: (executor: TransactionExecutor) => Promise<T>): Promise<T> {
    const ctx = this.tenantContextService.get();
    if (ctx) {
      return this.withTenant(ctx, fn);
    }
    return runInTransaction(this.database, (tx) => fn(tx as TransactionExecutor));
  }

  async withTenant<T>(
    ctx: TenantContext,
    fn: (executor: TransactionExecutor) => Promise<T>,
  ): Promise<T> {
    return withTenantContext(this.database, ctx, (tx) => fn(tx as TransactionExecutor));
  }

  async withSavepoint<T>(
    executor: TransactionExecutor,
    name: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const tx = toSavepointExecutor(executor);

    // Savepoint names are PostgreSQL identifiers. A job id is a UUID containing
    // hyphens ("550e8400-e29b-..."), which is not a valid bare identifier, so
    // the name must be double-quoted (and any embedded quote escaped) to avoid
    // a syntax error. See H-002 (Feature 07 Round 5).
    const escaped = name.replace(/"/g, '""');
    const identifier = `"${escaped}"`;
    try {
      await tx.execute(sql.raw(`SAVEPOINT ${identifier}`));
      const result = await fn();
      await tx.execute(sql.raw(`RELEASE SAVEPOINT ${identifier}`));
      return result;
    } catch (error) {
      await tx.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${identifier}`));
      await tx.execute(sql.raw(`RELEASE SAVEPOINT ${identifier}`));
      throw error;
    }
  }
}
