import type { TransactionExecutor } from '@repo/api-core';

import type { AccessControlRepository } from '../infrastructure/access-control.repository';

export type RoleRecord = NonNullable<
  Awaited<ReturnType<AccessControlRepository['findRoleByName']>>
>;

export interface AccessControlRepositoryPort {
  ensureRoles(
    roleValues: Parameters<AccessControlRepository['ensureRoles']>[0],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['ensureRoles']>;
  ensurePermissions(
    permissionValues: Parameters<AccessControlRepository['ensurePermissions']>[0],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['ensurePermissions']>;
  replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['replaceRolePermissions']>;
  createRole(
    values: Parameters<AccessControlRepository['createRole']>[0],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['createRole']>;
  updateRole(
    roleId: string,
    values: Parameters<AccessControlRepository['updateRole']>[1],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['updateRole']>;
  deleteRole(
    roleId: string,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['deleteRole']>;
  findRoleById(
    roleId: string,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findRoleById']>;
  findUserIdsForRole(
    roleId: string,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findUserIdsForRole']>;
  findUserIdsForPermission(
    permissionId: string,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findUserIdsForPermission']>;
  findRoleNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findRoleNamesForUser']>;
  findPermissionNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findPermissionNamesForUser']>;
  findRoleNamesForUsers(
    userIds: string[],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findRoleNamesForUsers']>;
  findRoleIdsForUser(
    userId: string,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findRoleIdsForUser']>;
  findRoleIdsForUsers(
    userIds: string[],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findRoleIdsForUsers']>;
  findRolesByIds(
    roleIds: string[],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findRolesByIds']>;
  findPermissionsByIds(
    permissionIds: string[],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findPermissionsByIds']>;
  findPermissionsByNames(
    permissionNames: string[],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findPermissionsByNames']>;
  findAllPermissions(
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findAllPermissions']>;
  findPermissionIdsForRole(
    roleId: string,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findPermissionIdsForRole']>;
  findPermissionsForRoleIds(
    roleIds: string[],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findPermissionsForRoleIds']>;
  findPermissionById(
    permissionId: string,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findPermissionById']>;
  createPermission(
    values: Parameters<AccessControlRepository['createPermission']>[0],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['createPermission']>;
  updatePermission(
    permissionId: string,
    values: Parameters<AccessControlRepository['updatePermission']>[1],
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['updatePermission']>;
  deletePermission(
    permissionId: string,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['deletePermission']>;
  findRoleByName(
    name: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findRoleByName']>;
  assignUserRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['assignUserRole']>;
  findAllRoles(
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findAllRoles']>;
  findManageableRolesForActor(
    organizationId: string | null,
    includePlatformRoles: boolean,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['findManageableRolesForActor']>;
  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): ReturnType<AccessControlRepository['replaceUserRoles']>;
}

export const ACCESS_CONTROL_REPOSITORY = Symbol('ACCESS_CONTROL_REPOSITORY');
