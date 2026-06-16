import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE } from '@repo/api-database';
import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';
import { userPreferences } from '@repo/api-database';

@Injectable()
export class PreferencesRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async findByUserId(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [preferences] = await executor
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return preferences ?? null;
  }

  async upsert(
    userId: string,
    values: Partial<typeof userPreferences.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const existing = await this.findByUserId(userId, executor);

    if (!existing) {
      const [created] = await executor
        .insert(userPreferences)
        .values({
          userId,
          theme: values.theme ?? 'system',
          language: values.language ?? 'en',
          timezone: values.timezone ?? 'UTC',
          notificationPreferences: values.notificationPreferences ?? {},
          emailPreferences: values.emailPreferences ?? {},
        })
        .returning();

      return created ?? null;
    }

    const [updated] = await executor
      .update(userPreferences)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId))
      .returning();

    return updated ?? null;
  }
}
