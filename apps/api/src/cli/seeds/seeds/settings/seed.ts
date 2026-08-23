import type { EnsureSettingsSeedDataUseCase } from "@platform/modules/settings/application/use-cases/ensure-settings-seed-data.use-case";

import { type DatabaseExecutor } from "@repo/api-database";

export async function seedSettings(
  ensureSettingsSeedData: EnsureSettingsSeedDataUseCase,
  executor: DatabaseExecutor,
): Promise<void> {
  // Settings are part of the baseline tenant state and should be present before downstream fixtures run.
  await ensureSettingsSeedData.execute(executor);
}
