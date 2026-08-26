import type { TransactionExecutor } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";

import {
  SETTINGS_REPOSITORY,
  type SettingsRepositoryPort,
} from "../ports/settings.repository.port";

@Injectable()
export class EnsureSettingsSeedDataUseCase {
  constructor(
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepository: SettingsRepositoryPort,
  ) {}

  async execute(executor?: TransactionExecutor) {
    await this.settingsRepository.ensureDefaults(
      [
        {
          key: "registration_enabled",
          value: { enabled: true },
        },
        {
          key: "maintenance_mode",
          value: { enabled: false, message: null },
        },
      ],
      executor,
    );
  }
}
