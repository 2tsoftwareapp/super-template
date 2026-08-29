import type { TransactionExecutor } from "@repo/api-runtime";
import type { PersonalOrganizationProvider } from "@repo/feature-organizations/contracts";
import type { OrganizationAccessControlPort } from "@repo/feature-organizations/contracts";

import { Inject, Injectable } from "@nestjs/common";
import { ORGANIZATION_ACCESS_CONTROL } from "@repo/feature-organizations/contracts";
import { EnsurePersonalOrganizationUseCase as CoreEnsurePersonalOrganization } from "@repo/feature-organizations/module";

/**
 * Orchestration-layer personal-organization creation that adds RBAC
 * admin-role assignment after the core organization is created.
 * Implements PersonalOrganizationProvider so the management module
 * can override the core PERSONAL_ORGANIZATION_PROVIDER token.
 */
@Injectable()
export class EnsurePersonalOrganizationUseCase implements PersonalOrganizationProvider {
  constructor(
    private readonly coreEnsurePersonalOrganization: CoreEnsurePersonalOrganization,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
  ) {}

  async ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor?: TransactionExecutor,
  ): Promise<unknown> {
    const organizationId = await this.coreEnsurePersonalOrganization.execute(
      userId,
      displayName,
      executor,
    );

    await this.accessControl.ensureOrganizationAdminRole(organizationId, userId, executor);

    return organizationId;
  }
}
