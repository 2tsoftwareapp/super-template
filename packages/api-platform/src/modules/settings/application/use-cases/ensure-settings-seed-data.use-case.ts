import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import { SettingsRepository } from '../../infrastructure/settings.repository';

@Injectable()
export class EnsureSettingsSeedDataUseCase {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(executor?: DatabaseExecutor) {
    await this.settingsRepository.ensureDefaults(
      [
        {
          key: 'registration_enabled',
          value: { enabled: true },
        },
        {
          key: 'maintenance_mode',
          value: { enabled: false, message: null },
        },
      ],
      executor,
    );
  }
}
