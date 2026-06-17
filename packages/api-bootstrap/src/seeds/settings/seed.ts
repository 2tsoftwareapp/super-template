import type { SettingsService } from '@repo/api-platform/modules/settings/application/settings.service';

import { type DatabaseExecutor } from '@repo/api-database';

export async function seedSettings(
  settingsService: SettingsService,
  executor: DatabaseExecutor,
): Promise<void> {
  // Settings are part of the baseline tenant state and should be present before downstream fixtures run.
  await settingsService.ensureSeedData(executor);
}
