import type { TransactionExecutor } from '@repo/api-core';

export interface RoleRecord {
  id: string;
  organizationId: string | null;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface PermissionRecord {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface RolePermissionRecord extends PermissionRecord {
  roleId: string;
}

export interface CreateRoleValues {
  name: string;
  description: string;
  organizationId?: string | null;
  isSystem?: boolean;
}

export interface UpdateRoleValues {
  name?: string;
  description?: string | null;
}

export interface CreatePermissionValues {
  name: string;
  description: string;
  isSystem?: boolean;
}

export interface UpdatePermissionValues {
  name?: string;
  description?: string | null;
}

export interface AccessControlRepositoryPort {
  ensureRoles(
    roleValues: {
      name: string;
      description: string;
      organizationId?: string | null;
      isSystem?: boolean;
    }[],
    executor?: TransactionExecutor,
  ): Promise<RoleRecord[]>;
  ensurePermissions(
    permissionValues: {
      name: string;
      description: string;
      isSystem?: boolean;
    }[],
    executor?: TransactionExecutor,
  ): Promise<PermissionRecord[]>;
  replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    executor?: TransactionExecutor,
  ): Promise<void>;
  createRole(
    values: CreateRoleValues,
    executor?: TransactionExecutor,
  ): Promise<RoleRecord | null>;
  updateRole(
    roleId: string,
    values: UpdateRoleValues,
    executor?: TransactionExecutor,
  ): Promise<RoleRecord | null>;
  deleteRole(
    roleId: string,
    executor?: TransactionExecutor,
  ): Promise<void>;
  findRoleById(
    roleId: string,
    executor?: TransactionExecutor,
  ): Promise<RoleRecord | null>;
  findRoleByIdWithLock(
    roleId: string,
    executor: TransactionExecutor,
  ): Promise<RoleRecord | null>;
  findUserIdsForRole(
    roleId: string,
    executor?: TransactionExecutor,
  ): Promise<string[]>;
  findUserIdsForPermission(
    permissionId: string,
    executor?: TransactionExecutor,
  ): Promise<string[]>;
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
  ): Promise<{ roleName: string; roleId: string; organizationId: string | null }[]>;
  findRoleIdsForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<{ userId: string; roleId: string }[]>;
  findRolesByIds(
    roleIds: string[],
    executor?: TransactionExecutor,
  ): Promise<RoleRecord[]>;
  findPermissionsByIds(
    permissionIds: string[],
    executor?: TransactionExecutor,
  ): Promise<PermissionRecord[]>;
  findPermissionsByNames(
    permissionNames: string[],
    executor?: TransactionExecutor,
  ): Promise<PermissionRecord[]>;
  findAllPermissions(
    executor?: TransactionExecutor,
  ): Promise<PermissionRecord[]>;
  findPermissionIdsForRole(
    roleId: string,
    executor?: TransactionExecutor,
  ): Promise<string[]>;
  findPermissionsForRoleIds(
    roleIds: string[],
    executor?: TransactionExecutor,
  ): Promise<RolePermissionRecord[]>;
  findPermissionById(
    permissionId: string,
    executor?: TransactionExecutor,
  ): Promise<PermissionRecord | null>;
  createPermission(
    values: CreatePermissionValues,
    executor?: TransactionExecutor,
  ): Promise<PermissionRecord | null>;
  updatePermission(
    permissionId: string,
    values: UpdatePermissionValues,
    executor?: TransactionExecutor,
  ): Promise<PermissionRecord | null>;
  deletePermission(
    permissionId: string,
    executor?: TransactionExecutor,
  ): Promise<void>;
  findRoleByName(
    name: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<RoleRecord | null>;
  assignUserRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<void>;
  findAllRoles(
    executor?: TransactionExecutor,
  ): Promise<RoleRecord[]>;
  findManageableRolesForActor(
    organizationId: string | null,
    includePlatformRoles: boolean,
    executor?: TransactionExecutor,
  ): Promise<RoleRecord[]>;
  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<void>;
}

export const ACCESS_CONTROL_REPOSITORY = Symbol('ACCESS_CONTROL_REPOSITORY');
