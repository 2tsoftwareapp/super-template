import { Inject, Injectable } from "@nestjs/common";
import type { TransactionExecutor } from "@repo/api-kernel";
import type { OrganizationModelOptions } from "@repo/api-kernel";
import { ORGANIZATION_MODEL_OPTIONS } from "@repo/database-runtime";
import type { OrganizationAccessControlPort } from "@repo/feature-organizations/contracts";
import { ORGANIZATION_ACCESS_CONTROL } from "@repo/feature-organizations/contracts";
import { EnsurePersonalOrganizationUseCase as CoreEnsurePersonalOrganization } from "@repo/feature-organizations/module";

import type { PersonalOrganizationProvisioner } from "../../public/contracts";

/**
 * RBAC-aware personal-organization creation.
 * Creates the organization via the core use case, then assigns
 * the organization admin role through access-control.
 *
 * In the `org-optional` organization model this provisioner is disabled:
 * registration, SSO signup, and platform-user creation no longer force a
 * personal organization onto every user. Callers that explicitly need an
 * organization (org-management flows, explicit org creation) call the
 * core use case or create organizations directly instead.
 */
@Injectable()
export class EnsurePersonalOrganizationUseCase implements PersonalOrganizationProvisioner {
  constructor(
    private readonly coreEnsurePersonalOrganization: CoreEnsurePersonalOrganization,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
    @Inject(ORGANIZATION_MODEL_OPTIONS)
    private readonly organizationModelOptions: OrganizationModelOptions,
  ) {}

  async ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor?: TransactionExecutor,
  ): Promise<string | null> {
    if (this.organizationModelOptions.organizationModel === "org-optional") {
      return null;
    }

    const organizationId = await this.coreEnsurePersonalOrganization.execute(
      userId,
      displayName,
      executor,
    );

    await this.accessControl.ensureOrganizationAdminRole(organizationId, userId, executor);

    return organizationId;
  }
}
