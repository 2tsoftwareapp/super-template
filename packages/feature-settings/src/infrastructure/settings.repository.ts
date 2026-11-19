import type { JsonObject, TransactionExecutor } from "@repo/api-kernel";
import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/database-runtime";
import { eq } from "drizzle-orm";

import { applicationSettings } from "./persistence";

@Injectable()
export class SettingsRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  /**
   * Application code passes an opaque `TransactionExecutor`; this is the one
   * place that knows it is a Drizzle client or transaction.
   */
  private db(executor?: TransactionExecutor): DatabaseExecutor {
    return (executor ?? this.database) as DatabaseExecutor;
  }

  async findAll(executor?: TransactionExecutor) {
    return this.db(executor).select().from(applicationSettings);
  }

  async findByKey(key: string, executor?: TransactionExecutor) {
    const [setting] = await this.db(executor)
      .select()
      .from(applicationSettings)
      .where(eq(applicationSettings.key, key))
      .limit(1);

    return setting ?? null;
  }

  async upsert(
    key: string,
    value: JsonObject,
    updatedById: string | null,
    executor?: TransactionExecutor,
  ) {
    const existing = await this.findByKey(key, executor);

    if (!existing) {
      const [created] = await this.db(executor)
        .insert(applicationSettings)
        .values({
          key,
          value,
          updatedById,
        })
        .returning();

      return created ?? null;
    }

    const [updated] = await this.db(executor)
      .update(applicationSettings)
      .set({
        value,
        updatedById,
        updatedAt: new Date(),
      })
      .where(eq(applicationSettings.key, key))
      .returning();

    return updated ?? null;
  }

  async ensureDefaults(
    defaults: { key: string; value: JsonObject }[],
    executor?: TransactionExecutor,
  ) {
    for (const item of defaults) {
      const existing = await this.findByKey(item.key, executor);

      if (!existing) {
        await this.db(executor).insert(applicationSettings).values({
          key: item.key,
          value: item.value,
        });
      }
    }
  }
}
