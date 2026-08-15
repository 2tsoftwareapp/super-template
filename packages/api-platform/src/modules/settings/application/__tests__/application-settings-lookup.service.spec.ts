import { describe, expect, it, vi } from 'vitest';

import { ApplicationSettingsLookupService } from '../application-settings-lookup.service';

describe('ApplicationSettingsLookupService', () => {
  it('defaults registration to enabled when the setting row is missing', async () => {
    const settingsRepository = {
      findByKey: vi.fn(async () => null),
    };

    const service = new ApplicationSettingsLookupService(
      settingsRepository as never,
    );

    await expect(service.isRegistrationEnabled()).resolves.toBe(true);
    await expect(service.isMaintenanceMode()).resolves.toBe(false);
  });

  it('reads the enabled flag from stored values', async () => {
    const settingsRepository = {
      findByKey: vi
        .fn()
        .mockImplementation(async (key: string) => {
          if (key === 'registration_enabled') {
            return { key, value: { enabled: false } };
          }
          return { key, value: { enabled: true } };
        }),
    };

    const service = new ApplicationSettingsLookupService(
      settingsRepository as never,
    );

    await expect(service.isRegistrationEnabled()).resolves.toBe(false);
    await expect(service.isMaintenanceMode()).resolves.toBe(true);
  });

  it('treats malformed values as disabled', async () => {
    const settingsRepository = {
      findByKey: vi.fn(async (key: string) => ({
        key,
        value: { enabled: 'yes' },
      })),
    };

    const service = new ApplicationSettingsLookupService(
      settingsRepository as never,
    );

    await expect(service.isRegistrationEnabled()).resolves.toBe(false);
    await expect(service.isMaintenanceMode()).resolves.toBe(false);
  });
});
