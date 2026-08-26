 
import type { FeatureSeedContext, FeatureSeeder } from "@repo/api-plugin-kit";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { EnsureSettingsSeedDataUseCase } from "./application/use-cases/ensure-settings-seed-data.use-case";

async function runSettingsSeed(ctx: FeatureSeedContext): Promise<void> {
  const ensureSettingsSeedData = ctx.app.get(EnsureSettingsSeedDataUseCase) as EnsureSettingsSeedDataUseCase;
  const executor = ctx.executor as DatabaseExecutor;
  // Settings are part of the baseline tenant state and should be present before downstream fixtures run.
  await ensureSettingsSeedData.execute(executor);
}

export const settingsSeeders: readonly FeatureSeeder[] = [
  { id: "settings", run: runSettingsSeed },
];
