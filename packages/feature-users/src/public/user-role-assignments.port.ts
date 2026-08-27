import type { TransactionExecutor } from "@repo/api-runtime";

/**
 * Consumer-owned port: role-assignment persistence lives in feature-users
 * storage, so the port is defined here and bound by UsersModule. Other
 * features (access-control, organizations) consume it through this
 * contract without importing the users implementation.
 */
export interface UserRoleAssignment {
  roleName: string;
  roleId: string;
  organizationId: string | null;
}

export interface UserRoleAssignments {
  findUserIdsForRole(roleId: string, executor?: TransactionExecutor): Promise<string[]>;

  findUserIdsForRoleName(
    roleName: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  findUserIdsForPermission(permissionId: string, executor?: TransactionExecutor): Promise<string[]>;

  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<void>;

  findRoleNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  findPermissionNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  findRoleNamesForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<{ userId: string; roleName: string }[]>;

  findRoleIdsForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  findRoleAssignmentsForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<UserRoleAssignment[]>;

  findRoleIdsForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<{ userId: string; roleId: string }[]>;

  assignUserRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<void>;

  deleteByOrganizationId(organizationId: string, executor?: TransactionExecutor): Promise<void>;
}
