import type { UserRoleAssignments } from "@repo/api-runtime";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { Injectable } from "@nestjs/common";
import { resolveLazyPort, USER_ROLE_ASSIGNMENTS } from "@repo/api-runtime";

import type {
  AccessControlRepositoryPort,
  CreatePermissionValues,
  RoleRecord,
} from "../application/ports/access-control.repository.port";

import { AccessControlPermissionPersistence } from "./access-control-permission.persistence";
import { AccessControlRolePersistence } from "./access-control-role.persistence";

@Injectable()
export class AccessControlRepository implements AccessControlRepositoryPort {
  constructor(
    private readonly rolePersistence: AccessControlRolePersistence,
    private readonly permissionPersistence: AccessControlPermissionPersistence,
  ) {}

  private userRoleAssignments(): UserRoleAssignments {
    return resolveLazyPort<UserRoleAssignments>(USER_ROLE_ASSIGNMENTS);
  }

  findRolesPaginated(
    params: Parameters<AccessControlRolePersistence["findRolesPaginated"]>[0],
    executor?: DatabaseExecutor,
  ) {
    return this.rolePersistence.findRolesPaginated(params, executor);
  }
  findAllRoles(executor?: DatabaseExecutor) {
    return this.rolePersistence.findAllRoles(executor);
  }
  findManageableRolesForActor(
    organizationId: string | null,
    includePlatformRoles: boolean,
    executor?: DatabaseExecutor,
  ) {
    return this.rolePersistence.findManageableRolesForActor(
      organizationId,
      includePlatformRoles,
      executor,
    );
  }
  findRoleById(roleId: string, executor?: DatabaseExecutor) {
    return this.rolePersistence.findRoleById(roleId, executor);
  }
  findRoleByIdWithLock(roleId: string, executor: DatabaseExecutor) {
    return this.rolePersistence.findRoleByIdWithLock(roleId, executor);
  }
  findRolesByIds(roleIds: string[], executor?: DatabaseExecutor) {
    return this.rolePersistence.findRolesByIds(roleIds, executor);
  }
  findRolesByNames(roleNames: string[], executor?: DatabaseExecutor) {
    return this.rolePersistence.findRolesByNames(roleNames, executor);
  }
  findRoleByName(name: string, organizationId: string | null = null, executor?: DatabaseExecutor) {
    return this.rolePersistence.findRoleByName(name, organizationId, executor);
  }
  ensureRoles(
    roleValues: Parameters<AccessControlRolePersistence["ensureRoles"]>[0],
    executor?: DatabaseExecutor,
  ) {
    return this.rolePersistence.ensureRoles(roleValues, executor);
  }
  createRole(
    values: Parameters<AccessControlRolePersistence["createRole"]>[0],
    executor?: DatabaseExecutor,
  ) {
    return this.rolePersistence.createRole(values, executor);
  }
  updateRole(
    roleId: string,
    values: Parameters<AccessControlRolePersistence["updateRole"]>[1],
    executor?: DatabaseExecutor,
  ) {
    return this.rolePersistence.updateRole(roleId, values, executor);
  }
  deleteRole(roleId: string, executor?: DatabaseExecutor) {
    return this.rolePersistence.deleteRole(roleId, executor);
  }
  ensureOrganizationSystemRole(
    name: string,
    description: string,
    organizationId: string,
    executor?: DatabaseExecutor,
  ): Promise<RoleRecord> {
    return this.rolePersistence.ensureOrganizationSystemRole(
      name,
      description,
      organizationId,
      executor,
    );
  }

  findAllPermissions(executor?: DatabaseExecutor) {
    return this.permissionPersistence.findAllPermissions(executor);
  }
  findPermissionsForRoleIds(roleIds: string[], executor?: DatabaseExecutor) {
    return this.permissionPersistence.findPermissionsForRoleIds(roleIds, executor);
  }
  findPermissionsByIds(permissionIds: string[], executor?: DatabaseExecutor) {
    return this.permissionPersistence.findPermissionsByIds(permissionIds, executor);
  }
  findPermissionsByNames(permissionNames: string[], executor?: DatabaseExecutor) {
    return this.permissionPersistence.findPermissionsByNames(permissionNames, executor);
  }
  findPermissionById(permissionId: string, executor?: DatabaseExecutor) {
    return this.permissionPersistence.findPermissionById(permissionId, executor);
  }
  findPermissionIdsForRole(roleId: string, executor?: DatabaseExecutor) {
    return this.permissionPersistence.findPermissionIdsForRole(roleId, executor);
  }
  ensurePermissions(
    permissionValues: Parameters<AccessControlPermissionPersistence["ensurePermissions"]>[0],
    executor?: DatabaseExecutor,
  ) {
    return this.permissionPersistence.ensurePermissions(permissionValues, executor);
  }
  replaceRolePermissions(roleId: string, permissionIds: string[], executor?: DatabaseExecutor) {
    return this.permissionPersistence.replaceRolePermissions(roleId, permissionIds, executor);
  }
  createPermission(values: CreatePermissionValues, executor?: DatabaseExecutor) {
    return this.permissionPersistence.createPermission(values, executor);
  }
  updatePermission(
    permissionId: string,
    values: Parameters<AccessControlPermissionPersistence["updatePermission"]>[1],
    executor?: DatabaseExecutor,
  ) {
    return this.permissionPersistence.updatePermission(permissionId, values, executor);
  }
  deletePermission(permissionId: string, executor?: DatabaseExecutor) {
    return this.permissionPersistence.deletePermission(permissionId, executor);
  }

  findUserIdsForRole(roleId: string, executor?: DatabaseExecutor) {
    return this.userRoleAssignments().findUserIdsForRole(roleId, executor);
  }
  findUserIdsForPermission(permissionId: string, executor?: DatabaseExecutor) {
    return this.userRoleAssignments().findUserIdsForPermission(permissionId, executor);
  }
  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.userRoleAssignments().replaceUserRoles(userId, roleIds, organizationId, executor);
  }
  findRoleNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.userRoleAssignments().findRoleNamesForUser(userId, organizationId, executor);
  }
  findPermissionNamesForUser(
    userId: string,
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.userRoleAssignments().findPermissionNamesForUser(userId, organizationId, executor);
  }
  findRoleNamesForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.userRoleAssignments().findRoleNamesForUsers(userIds, organizationId, executor);
  }
  findRoleIdsForUser(userId: string, organizationId?: string | null, executor?: DatabaseExecutor) {
    return this.userRoleAssignments().findRoleIdsForUser(userId, organizationId, executor);
  }
  findRoleAssignmentsForUser(
    userId: string,
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.userRoleAssignments().findRoleAssignmentsForUser(userId, organizationId, executor);
  }
  findRoleIdsForUsers(
    userIds: string[],
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.userRoleAssignments().findRoleIdsForUsers(userIds, organizationId, executor);
  }
  assignUserRole(
    userId: string,
    roleId: string,
    organizationId: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.userRoleAssignments().assignUserRole(userId, roleId, organizationId, executor);
  }
}
