import type { AccessControlService } from "@repo/feature-identity/modules/access-control";

import { type DatabaseExecutor } from "@repo/api-database";

export async function seedAccessControl(
  accessControlService: AccessControlService,
  executor: DatabaseExecutor,
): Promise<void> {
  // Role and permission seeds are foundational; every other fixture depends on this graph being present first.
  await accessControlService.ensureSeedData(executor);
}
