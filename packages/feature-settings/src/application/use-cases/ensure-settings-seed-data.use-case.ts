import type { TransactionExecutor } from "@repo/api-kernel";

import { Injectable } from "@nestjs/common";

import { SettingsRepository } from "../../infrastructure/settings.repository";
import { listSettingDefaults } from "../setting-definitions";

@Injectable()
export class EnsureSettingsSeedDataUseCase {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(executor?: TransactionExecutor) {
    // Defaults come from the settings registry (SETTING_DEFINITIONS), so the
    // seed, the lookup fallback, and update validation can never drift apart.
    await this.settingsRepository.ensureDefaults(listSettingDefaults(), executor);
  }
}
