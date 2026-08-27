import type { TransactionExecutor } from "@repo/api-kernel";

import type { OrganizationMemberRole } from "./organization-lookup.port";

export { OrganizationsService } from "../application/organizations.service";
export { ORGANIZATIONS_REPOSITORY } from "../application/ports/organizations.repository.port";
export type * from "../application/ports/organizations.repository.port";
/** Public contracts for @repo/feature-organizations. */
export { OrganizationsModule } from "../organizations.module";

export { ORGANIZATION_MEMBERSHIP } from "./organization-membership.token";
export { ORGANIZATION_USER_ROLES_PURGE } from "./organization-purge.token";
export { ORGANIZATION_CUSTOM_ROLES_PURGE } from "./organization-custom-roles-purge.token";
export { ORGANIZATION_ACCESS_CONTROL } from "./organization-access-control.token";

export interface OrganizationMemberRecord {
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMemberWithUserRecord {
  userId: string;
  role: OrganizationMemberRole;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOrganizationRecord {
  id: string;
  name: string;
  slug: string;
  role: OrganizationMemberRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Consumer-owned port: membership rows live in feature-users storage, but
 * organizations defines the contract it needs. Implemented by feature-users
 * and bound through its global integration providers.
 */
export interface OrganizationMembership {
  addMember(
    values: { organizationId: string; userId: string; role: OrganizationMemberRole },
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  upsertMember(
    values: { organizationId: string; userId: string; role: OrganizationMemberRole },
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  findMembership(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  listForUser(userId: string, executor?: TransactionExecutor): Promise<UserOrganizationRecord[]>;

  listMembers(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberWithUserRecord[]>;

  findUserIdsForOrganization(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  countOwners(
    organizationId: string,
    options?: { excludingUserId?: string; executor?: TransactionExecutor; lock?: boolean },
  ): Promise<number>;

  countMembers(organizationId: string, executor?: TransactionExecutor): Promise<number>;

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationMemberRole,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  removeMember(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  findPrimaryOrganizationId(userId: string, executor?: TransactionExecutor): Promise<string | null>;

  deleteByOrganizationId(organizationId: string, executor?: TransactionExecutor): Promise<void>;
}

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

export * from "./organization-lookup.port";
export { ORGANIZATION_ERROR_CODES } from "./error-codes";
