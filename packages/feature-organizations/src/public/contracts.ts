import type { TransactionExecutor } from "@repo/api-kernel";

export type { CreateOrganizationCommand } from "../application/organizations.types";

export { ORGANIZATIONS_REPOSITORY } from "../application/ports/organizations.repository.port";
export type * from "../application/ports/organizations.repository.port";
/** Public contracts for @repo/feature-organizations. */

export { ORGANIZATION_ERROR_CODES } from "./error-codes";
export { ORGANIZATION_ACCESS_CONTROL } from "./organization-access-control.token";
export { ORGANIZATION_CUSTOM_ROLES_PURGE } from "./organization-custom-roles-purge.token";
export * from "./organization-lookup.port";
export type * from "./organization-membership.port";
export { ORGANIZATION_MEMBERSHIP } from "./organization-membership.token";
export { ORGANIZATION_USER_ROLES_PURGE } from "./organization-purge.token";

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
