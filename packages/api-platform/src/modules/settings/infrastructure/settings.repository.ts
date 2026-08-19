import type { DatabaseClient, DatabaseExecutor } from "@repo/api-database";

import { Inject, Injectable } from "@nestjs/common";
import { type JsonObject } from "@repo/api-core";
import { DATABASE } from "@repo/api-database";
import { applicationSettings } from "@repo/api-database";
import { eq } from "drizzle-orm";

import type { SettingsRepositoryPort } from "../application/ports/settings.repository.port";

@Injectable()
export class SettingsRepository implements SettingsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async findAll(executor: DatabaseExecutor = this.database) {
    return executor.select().from(applicationSettings);
  }

  async findByKey(key: string, executor: DatabaseExecutor = this.database) {
    const [setting] = await executor
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
    executor: DatabaseExecutor = this.database,
  ) {
    const existing = await this.findByKey(key, executor);

    if (!existing) {
      const [created] = await executor
        .insert(applicationSettings)
        .values({
          key,
          value,
          updatedById,
        })
        .returning();

      return created ?? null;
    }

    const [updated] = await executor
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
    executor: DatabaseExecutor = this.database,
  ) {
    for (const item of defaults) {
      const existing = await this.findByKey(item.key, executor);

      if (!existing) {
        await executor.insert(applicationSettings).values({
          key: item.key,
          value: item.value,
        });
      }
    }
  }
}
