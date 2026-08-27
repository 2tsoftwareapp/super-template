import type { DatabaseExecutor } from "@repo/database-runtime";

import { Injectable } from "@nestjs/common";
import {
  ORGANIZATION_CUSTOM_ROLES_PURGE,
  type OrganizationCustomRolesPurgePort,
} from "@repo/feature-organizations/contracts";

import { AccessControlRolePersistence } from "./access-control-role.persistence";

/**
 * Implements the organizations-owned custom-roles purge port so organization
 * deletion never touches access-control tables directly.
 */
@Injectable()
export class OrganizationCustomRolesPurgeAdapter implements OrganizationCustomRolesPurgePort {
  constructor(private readonly rolePersistence: AccessControlRolePersistence) {}

  async deleteByOrganizationId(
    organizationId: string,
    executor?: DatabaseExecutor,
  ): Promise<void> {
    await this.rolePersistence.deleteByOrganizationId(organizationId, executor);
  }
}

export const ORGANIZATION_CUSTOM_ROLES_PURGE_PROVIDER = {
  provide: ORGANIZATION_CUSTOM_ROLES_PURGE,
  useExisting: OrganizationCustomRolesPurgeAdapter,
};
