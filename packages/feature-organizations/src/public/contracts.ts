import type { TransactionExecutor } from "@repo/api-kernel";

export { OrganizationsService } from "../application/organizations.service";
export { ORGANIZATIONS_REPOSITORY } from "../application/ports/organizations.repository.port";
export type * from "../application/ports/organizations.repository.port";
/** Public contracts for @repo/feature-organizations. */
export { OrganizationsModule } from "../organizations.module";

export { ORGANIZATION_ERROR_CODES } from "./error-codes";
export { ORGANIZATION_ACCESS_CONTROL } from "./organization-access-control.token";
export { ORGANIZATION_CUSTOM_ROLES_PURGE } from "./organization-custom-roles-purge.token";
export * from "./organization-lookup.port";

/**
 * Narrow consumer-owned ports used when an organization is deleted: each
 * owning feature purges the rows it owns without organizations importing
 * foreign schemas.
 */
export interface OrganizationUserRolePurgePort {
  deleteByOrganizationId(organizationId: string, executor?: TransactionExecutor): Promise<void>;
}

export interface OrganizationCustomRolesPurgePort {
  deleteByOrganizationId(organizationId: string, executor?: TransactionExecutor): Promise<void>;
}

/**
 * Consumer-owned seam for the role-management operations organizations need
 * when membership changes. Implemented by feature-access-control and bound
 * through its global module; organizations never imports access-control.
 */
export interface OrganizationAccessControlPort {
  ensureOrganizationAdminRole(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<void>;

  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<unknown>;

  invalidateAccessProfile(userId: string): Promise<void>;
}

export { ORGANIZATION_USER_ROLES_PURGE } from "./organization-purge.token";
/**
 * Organization-membership port is owned by @repo/feature-users (the
 * implementer). Re-exported here so existing organizations and consumer
 * code that imports it from feature-organizations/contracts keeps
 * working.
 */
export type {
  OrganizationMemberRecord,
  OrganizationMembership,
  OrganizationMemberWithUserRecord,
  UserOrganizationRecord,
} from "@repo/feature-users/contracts";

export { ORGANIZATION_MEMBERSHIP } from "@repo/feature-users/contracts";
