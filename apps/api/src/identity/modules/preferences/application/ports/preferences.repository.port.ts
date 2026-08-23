import type { JsonObject } from "@repo/api-core";
import type { TransactionExecutor } from "@repo/api-core";

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
    executor?: TransactionExecutor,
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
    executor?: TransactionExecutor,
  ): Promise<UserPreferencesRecord | null>;

  reset(userId: string, executor?: TransactionExecutor): Promise<UserPreferencesRecord | null>;
}

export const PREFERENCES_REPOSITORY = Symbol("PREFERENCES_REPOSITORY");
