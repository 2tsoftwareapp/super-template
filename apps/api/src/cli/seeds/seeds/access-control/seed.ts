import type { AccessControlService } from "@repo/feature-access-control/contracts";

import { type DatabaseExecutor } from "@repo/database-runtime";

export async function seedAccessControl(
  accessControlService: AccessControlService,
  executor: DatabaseExecutor,
): Promise<void> {
  // Role and permission seeds are foundational; every other fixture depends on this graph being present first.
  await accessControlService.ensureSeedData(executor);
}
