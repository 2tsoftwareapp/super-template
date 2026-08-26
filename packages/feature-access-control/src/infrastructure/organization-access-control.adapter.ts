import type { TransactionExecutor } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";
import {
  ORGANIZATION_ACCESS_CONTROL,
  type OrganizationAccessControlPort,
} from "@repo/feature-organizations/contracts";

import { AccessControlService } from "../application/access-control.service";

/**
 * Implements the organizations-owned access-control seam so membership flows
 * never import feature-access-control directly (package DAG stays one-way:
 * access-control -> organizations for the schema FK).
 */
@Injectable()
export class OrganizationAccessControlAdapter implements OrganizationAccessControlPort {
  constructor(@Inject(AccessControlService) private readonly accessControl: AccessControlService) {}

  async ensureOrganizationAdminRole(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    await this.accessControl.ensureOrganizationAdminRole(organizationId, userId, executor);
  }

  async replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<void> {
    await this.accessControl.replaceUserRoles(userId, roleIds, organizationId, executor);
  }

  async invalidateAccessProfile(userId: string): Promise<void> {
    await this.accessControl.invalidateAccessProfile(userId);
  }
}

export const ORGANIZATION_ACCESS_CONTROL_PROVIDER = {
  provide: ORGANIZATION_ACCESS_CONTROL,
  useExisting: OrganizationAccessControlAdapter,
};
