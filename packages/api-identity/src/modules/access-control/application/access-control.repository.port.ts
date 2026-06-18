import type { DatabaseExecutor } from '@repo/api-database';

import type { AccessControlRepository } from '../infrastructure/access-control.repository';

export type RoleRecord = NonNullable<
  Awaited<ReturnType<AccessControlRepository['findRoleByName']>>
>;

export interface AccessControlRepositoryPort {
  ensureRoles(
    roleValues: Parameters<AccessControlRepository['ensureRoles']>[0],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['ensureRoles']>;
  ensurePermissions(
    permissionValues: Parameters<AccessControlRepository['ensurePermissions']>[0],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['ensurePermissions']>;
  replaceRolePermissions(
    roleId: string,
    permissionIds: string[],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['replaceRolePermissions']>;
  createRole(
    values: Parameters<AccessControlRepository['createRole']>[0],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['createRole']>;
  updateRole(
    roleId: string,
    values: Parameters<AccessControlRepository['updateRole']>[1],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['updateRole']>;
  deleteRole(
    roleId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['deleteRole']>;
  findRoleById(
    roleId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRoleById']>;
  findUserIdsForRole(
    roleId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findUserIdsForRole']>;
  findUserIdsForPermission(
    permissionId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findUserIdsForPermission']>;
  findRoleNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRoleNamesForUser']>;
  findPermissionNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findPermissionNamesForUser']>;
  findRoleNamesForUsers(
    userIds: string[],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRoleNamesForUsers']>;
  findRoleIdsForUser(
    userId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRoleIdsForUser']>;
  findRoleIdsForUsers(
    userIds: string[],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRoleIdsForUsers']>;
  findRolesByIds(
    roleIds: string[],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRolesByIds']>;
  findPermissionsByIds(
    permissionIds: string[],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findPermissionsByIds']>;
  findPermissionsByNames(
    permissionNames: string[],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findPermissionsByNames']>;
  findAllPermissions(
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findAllPermissions']>;
  findPermissionIdsForRole(
    roleId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findPermissionIdsForRole']>;
  findPermissionsForRoleIds(
    roleIds: string[],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findPermissionsForRoleIds']>;
  findPermissionById(
    permissionId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findPermissionById']>;
  createPermission(
    values: Parameters<AccessControlRepository['createPermission']>[0],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['createPermission']>;
  updatePermission(
    permissionId: string,
    values: Parameters<AccessControlRepository['updatePermission']>[1],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['updatePermission']>;
  deletePermission(
    permissionId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['deletePermission']>;
  findRoleByName(
    name: string,
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRoleByName']>;
  assignUserRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['assignUserRole']>;
  findAllRoles(
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findAllRoles']>;
  findManageableRolesForActor(
    organizationId: string | null,
    includePlatformRoles: boolean,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findManageableRolesForActor']>;
  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['replaceUserRoles']>;
}

export const ACCESS_CONTROL_REPOSITORY = Symbol('ACCESS_CONTROL_REPOSITORY');
