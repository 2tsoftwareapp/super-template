import type { TransactionExecutor } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";

import {
  SETTINGS_REPOSITORY,
  type SettingsRepositoryPort,
} from "../ports/settings.repository.port";
import { listSettingDefaults } from "../setting-definitions";

@Injectable()
export class EnsureSettingsSeedDataUseCase {
  constructor(
    @Inject(SETTINGS_REPOSITORY) private readonly settingsRepository: SettingsRepositoryPort,
  ) {}

  async execute(executor?: TransactionExecutor) {
    // Defaults come from the settings registry (SETTING_DEFINITIONS), so the
    // seed, the lookup fallback, and update validation can never drift apart.
    await this.settingsRepository.ensureDefaults(listSettingDefaults(), executor);
  }
}
