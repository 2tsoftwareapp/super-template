import { Inject, Injectable } from '@nestjs/common';
import {
  type ApplicationSettingsLookup,
  isJsonObject,
  type JsonObject,
} from '@repo/api-core';

import {
  SETTINGS_REPOSITORY,
  type SettingsRepositoryPort,
} from './ports/settings.repository.port';

const REGISTRATION_ENABLED_KEY = 'registration_enabled';
const MAINTENANCE_MODE_KEY = 'maintenance_mode';

function readEnabledFlag(value: JsonObject | undefined): boolean {
  const enabled = value?.enabled;

  return typeof enabled === 'boolean' ? enabled : false;
}

/**
 * Adapter implementing the APPLICATION_SETTINGS_LOOKUP port for the platform
 * settings store. Consumers that only need to enforce toggles depend on the
 * api-core port instead of the settings repository directly.
 */
@Injectable()
export class ApplicationSettingsLookupService
  implements ApplicationSettingsLookup
{
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepositoryPort,
  ) {}

  async isRegistrationEnabled(): Promise<boolean> {
    const setting = await this.settingsRepository.findByKey(
      REGISTRATION_ENABLED_KEY,
    );

    // Absent setting means the seed has not run: keep the default permissive.
    if (!setting) {
      return true;
    }

    return readEnabledFlag(isJsonObject(setting.value) ? setting.value : undefined);
  }

  async isMaintenanceMode(): Promise<boolean> {
    const setting = await this.settingsRepository.findByKey(
      MAINTENANCE_MODE_KEY,
    );

    if (!setting) {
      return false;
    }

    return readEnabledFlag(isJsonObject(setting.value) ? setting.value : undefined);
  }
}
