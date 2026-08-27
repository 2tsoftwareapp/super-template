 
import type { FeatureSeedContext, FeatureSeeder } from "@repo/api-plugin-kit";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { AccessControlService } from "./application/access-control.service";

async function runAccessControlSeed(ctx: FeatureSeedContext): Promise<void> {
  const accessControlService = ctx.app.get(AccessControlService) as AccessControlService;
  const executor = ctx.executor as DatabaseExecutor;
  // Role and permission seeds are foundational; every other fixture depends on this graph being present first.
  await accessControlService.ensureSeedData(executor, ctx.authorization);
}

export const accessControlSeeders: readonly FeatureSeeder[] = [
  { id: "access-control", run: runAccessControlSeed },
];
