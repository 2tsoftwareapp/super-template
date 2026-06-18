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
  findUserIdsForRole(
    roleId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findUserIdsForRole']>;
  findRoleNamesForUser(
    userId: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRoleNamesForUser']>;
  findPermissionNamesForUser(
    userId: string,
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
  findRoleByName(
    name: string,
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findRoleByName']>;
  findAllRoles(
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['findAllRoles']>;
  replaceUserRoles(
    userId: string,
    roleIds: string[],
    executor?: DatabaseExecutor,
  ): ReturnType<AccessControlRepository['replaceUserRoles']>;
}

export const ACCESS_CONTROL_REPOSITORY = Symbol('ACCESS_CONTROL_REPOSITORY');
