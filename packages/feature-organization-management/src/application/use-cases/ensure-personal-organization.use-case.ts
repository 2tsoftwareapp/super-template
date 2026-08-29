import type { TransactionExecutor } from "@repo/api-runtime";
import type { OrganizationAccessControlPort } from "@repo/feature-organizations/contracts";

import { Inject, Injectable } from "@nestjs/common";
import { ORGANIZATION_ACCESS_CONTROL } from "@repo/feature-organizations/contracts";
import { EnsurePersonalOrganizationUseCase as CoreEnsurePersonalOrganization } from "@repo/feature-organizations/module";

import type { PersonalOrganizationProvisioner } from "../../public/contracts";

/**
 * RBAC-aware personal-organization creation.
 * Creates the organization via the core use case, then assigns
 * the organization admin role through access-control.
 */
@Injectable()
export class EnsurePersonalOrganizationUseCase implements PersonalOrganizationProvisioner {
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
