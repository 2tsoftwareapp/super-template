import type { TransactionExecutor } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";
import {
  ORGANIZATION_ACCESS_CONTROL,
  type OrganizationAccessControlPort,
} from "@repo/feature-organizations/contracts";
import { EnsurePersonalOrganizationUseCase as CoreEnsurePersonalOrganization } from "@repo/feature-organizations/module";

/**
 * Orchestration-layer personal-organization creation that adds RBAC
 * admin-role assignment after the core organization is created.
 */
@Injectable()
export class EnsurePersonalOrganizationUseCase {
  constructor(
    private readonly coreEnsurePersonalOrganization: CoreEnsurePersonalOrganization,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
  ) {}

  async execute(userId: string, displayName: string, executor?: TransactionExecutor) {
    const organizationId = await this.coreEnsurePersonalOrganization.execute(
      userId,
      displayName,
      executor,
    );

    await this.accessControl.ensureOrganizationAdminRole(organizationId, userId, executor);

    return organizationId;
  }
}
