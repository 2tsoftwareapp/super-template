import type { JsonObject } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

export interface UserPreferencesRecord {
  userId: string;
  theme: string;
  language: string;
  timezone: string;
  notificationPreferences: JsonObject;
  emailPreferences: JsonObject;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreferencesRepositoryPort {
  findByUserId(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<UserPreferencesRecord | null>;

  upsert(
    userId: string,
    values: Partial<{
      theme: string;
      language: string;
      timezone: string;
      notificationPreferences: JsonObject;
      emailPreferences: JsonObject;
    }>,
    executor?: DatabaseExecutor,
  ): Promise<UserPreferencesRecord | null>;

  reset(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<UserPreferencesRecord | null>;
}

export const PREFERENCES_REPOSITORY = Symbol('PREFERENCES_REPOSITORY');
