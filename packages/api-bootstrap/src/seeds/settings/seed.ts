import { type DatabaseExecutor } from '@repo/api-database';
import { SettingsService } from '@repo/api-platform/modules/settings/application/settings.service';

export async function seedSettings(
  settingsService: SettingsService,
  executor: DatabaseExecutor,
): Promise<void> {
  // Settings are part of the baseline tenant state and should be present before downstream fixtures run.
  await settingsService.ensureSeedData(executor);
}
