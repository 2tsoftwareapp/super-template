import type { TransactionExecutor } from '@repo/api-core';

export interface SettingRecord {
  key: string;
  value: Record<string, unknown>;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SettingsRepositoryPort {
  findAll(executor?: TransactionExecutor): Promise<SettingRecord[]>;

  findByKey(key: string, executor?: TransactionExecutor): Promise<SettingRecord | null>;

  upsert(
    key: string,
    value: Record<string, unknown>,
    updatedById: string | null,
    executor?: TransactionExecutor,
  ): Promise<SettingRecord | null>;

  ensureDefaults(
    defaults: { key: string; value: Record<string, unknown> }[],
    executor?: TransactionExecutor,
  ): Promise<void>;
}

export const SETTINGS_REPOSITORY = Symbol('SETTINGS_REPOSITORY');
