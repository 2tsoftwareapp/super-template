import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { userPreferences } from '@repo/api-database';
import { eq } from 'drizzle-orm';

import { DEFAULT_USER_PREFERENCES } from '../application/preferences.constants';

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
          theme: values.theme ?? DEFAULT_USER_PREFERENCES.theme,
          language: values.language ?? DEFAULT_USER_PREFERENCES.language,
          timezone: values.timezone ?? DEFAULT_USER_PREFERENCES.timezone,
          notificationPreferences:
            values.notificationPreferences ??
            DEFAULT_USER_PREFERENCES.notificationPreferences,
          emailPreferences:
            values.emailPreferences ?? DEFAULT_USER_PREFERENCES.emailPreferences,
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

  async reset(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return this.upsert(
      userId,
      {
        theme: DEFAULT_USER_PREFERENCES.theme,
        language: DEFAULT_USER_PREFERENCES.language,
        timezone: DEFAULT_USER_PREFERENCES.timezone,
        notificationPreferences:
          DEFAULT_USER_PREFERENCES.notificationPreferences,
        emailPreferences: DEFAULT_USER_PREFERENCES.emailPreferences,
      },
      executor,
    );
  }
}
