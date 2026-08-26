import type { EnsureSettingsSeedDataUseCase } from "@repo/feature-settings/contracts";

import { type DatabaseExecutor } from "@repo/database-runtime";

export async function seedSettings(
  ensureSettingsSeedData: EnsureSettingsSeedDataUseCase,
  executor: DatabaseExecutor,
): Promise<void> {
  // Settings are part of the baseline tenant state and should be present before downstream fixtures run.
  await ensureSettingsSeedData.execute(executor);
}
