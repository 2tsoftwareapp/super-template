import type { SettingsRepository } from '../infrastructure/settings.repository';

type SettingRecord = Awaited<
  ReturnType<SettingsRepository['findByKey']>
> extends infer T
  ? Exclude<T, null>
  : never;

export class SettingsMapper {
  static toDto(setting: SettingRecord) {
    return {
      key: setting.key,
      value: setting.value,
      updatedById: setting.updatedById ?? null,
      createdAt: setting.createdAt.toISOString(),
      updatedAt: setting.updatedAt.toISOString(),
    };
  }
}
