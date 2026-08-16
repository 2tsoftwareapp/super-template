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

/**
 * How long a fetched flag stays cached. The global MaintenanceModeGuard calls
 * isMaintenanceMode on every request; a short TTL avoids hammering the DB while
 * keeping toggles effective within a few seconds. Updates invalidate the cache
 * immediately (see UpdateSettingUseCase), so admin toggles apply at once.
 */
const CACHE_TTL_MS = 5_000;

function readEnabledFlag(value: JsonObject | undefined): boolean {
  const enabled = value?.enabled;

  return typeof enabled === 'boolean' ? enabled : false;
}

interface CachedFlag {
  value: boolean;
  expiresAt: number;
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
  private readonly cache = new Map<string, CachedFlag>();

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepositoryPort,
  ) {}

  async isRegistrationEnabled(): Promise<boolean> {
    // Absent setting means the seed has not run: keep the default permissive.
    return this.readFlag(REGISTRATION_ENABLED_KEY, true);
  }

  async isMaintenanceMode(): Promise<boolean> {
    return this.readFlag(MAINTENANCE_MODE_KEY, false);
  }

  /** Drop the cached flag for a setting key so the next read hits the store. */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  private async readFlag(key: string, defaultValue: boolean): Promise<boolean> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const setting = await this.settingsRepository.findByKey(key);
    const value = setting
      ? readEnabledFlag(isJsonObject(setting.value) ? setting.value : undefined)
      : defaultValue;

    this.cache.set(key, { value, expiresAt: now + CACHE_TTL_MS });
    return value;
  }
}
