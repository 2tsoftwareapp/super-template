import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '@repo/api-database/database.provider';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database/database.types';
import { applicationSettings } from '@repo/api-database/schema';

@Injectable()
export class SettingsRepository {
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
    value: Record<string, unknown>,
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
    defaults: Array<{ key: string; value: Record<string, unknown> }>,
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
