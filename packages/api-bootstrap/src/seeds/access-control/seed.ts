import { type DatabaseExecutor } from '@repo/api-database';
import { AccessControlService } from '@repo/api-identity/modules/access-control/application/access-control.service';

export async function seedAccessControl(
  accessControlService: AccessControlService,
  executor: DatabaseExecutor,
): Promise<void> {
  // Role and permission seeds are foundational; every other fixture depends on this graph being present first.
  await accessControlService.ensureSeedData(executor);
}
