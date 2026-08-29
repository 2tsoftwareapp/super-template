import type { AuthenticatedRequestUser, TransactionExecutor } from "@repo/api-runtime";

/**
 * Consumer-owned facade port for the access-control operations the users
 * bounded context needs. Implemented by AccessControlService in
 * @repo/feature-access-control; the binding lives in
 * AccessControlModule (which depends on @repo/feature-users) so this
 * package never imports from access-control.
 */
export interface UserAccessControl {
  getAccessProfile(
    userId: string,
    organizationId?: string | null,
  ): Promise<{ roles: string[]; permissions: string[] }>;

  getRoleIdsForUser(userId: string, organizationId?: string | null): Promise<string[]>;

  getRoleAssignmentsForUser(
    userId: string,
    organizationId?: string | null,
  ): Promise<{ roleId: string; roleName: string; organizationId: string | null }[]>;

  getRoleNamesForUsers(
    userIds: string[],
    organizationId?: string | null,
  ): Promise<Map<string, string[]>>;

  getRoleIdsForUsers(
    userIds: string[],
    organizationId?: string | null,
  ): Promise<Map<string, string[]>>;

  getRoleById(
    roleId: string,
    executor?: TransactionExecutor,
  ): Promise<{ id: string; name: string; organizationId: string | null; isSystem: boolean } | null>;

  getRoleByName(
    name: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<{ id: string; name: string; organizationId: string | null; isSystem: boolean } | null>;

  getOrganizationRoleByName(
    name: string,
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<{ id: string; name: string; organizationId: string | null; isSystem: boolean } | null>;

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

  assertCanAssignUserRoles(
    actor: AuthenticatedRequestUser,
    targetRoleNames: string[],
    desiredRoleNames: string[],
  ): void;

  assertCanManageUserAccount(actor: AuthenticatedRequestUser, targetRoleNames: string[]): void;

  /** Get all user IDs who hold the named role within the given organization scope. */
  getUserIdsForRole(roleName: string, organizationId?: string | null): Promise<string[]>;
}
