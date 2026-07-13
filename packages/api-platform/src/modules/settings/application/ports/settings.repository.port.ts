import type { DatabaseExecutor } from '@repo/api-database';

export interface SettingRecord {
  key: string;
  value: Record<string, unknown>;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsRepositoryPort {
  findAll(executor?: DatabaseExecutor): Promise<SettingRecord[]>;

  findByKey(key: string, executor?: DatabaseExecutor): Promise<SettingRecord | null>;

  upsert(
    key: string,
    value: Record<string, unknown>,
    updatedById: string | null,
    executor?: DatabaseExecutor,
  ): Promise<SettingRecord | null>;

  ensureDefaults(
    defaults: { key: string; value: Record<string, unknown> }[],
    executor?: DatabaseExecutor,
  ): Promise<void>;
}

export const SETTINGS_REPOSITORY = Symbol('SETTINGS_REPOSITORY');
