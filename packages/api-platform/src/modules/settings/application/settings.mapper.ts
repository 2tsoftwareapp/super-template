import type { SettingRecord } from './ports/settings.repository.port';

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
