import type { TransactionExecutor } from "../types/transaction-executor";

export interface UserRoleAssignment {
  roleName: string;
  roleId: string;
  organizationId: string | null;
}

export interface UserRoleAssignments {
  findUserIdsForRole(roleId: string, executor?: TransactionExecutor): Promise<string[]>;

  findUserIdsForPermission(
    permissionId: string,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

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

export const USER_ROLE_ASSIGNMENTS = Symbol("USER_ROLE_ASSIGNMENTS");
