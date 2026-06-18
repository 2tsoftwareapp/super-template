import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import {
  assertCanAssignRoles,
  assertCanManagePrivilegedAccount,
} from '../domain/role-assignment.policy';
import { AccessProfileUseCase } from './access-profile.use-case';
import { ReplaceUserRolesUseCase } from './replace-user-roles.use-case';
import { RoleManagementUseCase } from './role-management.use-case';
import { RoleQueryUseCase } from './role-query.use-case';
import { SeedAccessControlUseCase } from './seed-access-control.use-case';

export type { AccessProfileView, RoleView as RoleDto } from './access-control.types';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly seedAccessControlUseCase: SeedAccessControlUseCase,
    private readonly accessProfileUseCase: AccessProfileUseCase,
    private readonly roleQueryUseCase: RoleQueryUseCase,
    private readonly roleManagementUseCase: RoleManagementUseCase,
    private readonly replaceUserRolesUseCase: ReplaceUserRolesUseCase,
  ) {}

  ensureSeedData(executor?: DatabaseExecutor) {
    return this.seedAccessControlUseCase.execute(executor);
  }

  getAccessProfile(userId: string, organizationId: string | null = null) {
    return this.accessProfileUseCase.getAccessProfile(userId, organizationId);
  }

  invalidateAccessProfile(userId: string) {
    return this.accessProfileUseCase.invalidateAccessProfile(userId);
  }

  getRoleNamesForUsers(userIds: string[]) {
    return this.roleQueryUseCase.getRoleNamesForUsers(userIds);
  }

  getRoleIdsForUser(userId: string) {
    return this.roleQueryUseCase.getRoleIdsForUser(userId);
  }

  getRoleIdsForUsers(userIds: string[]) {
    return this.roleQueryUseCase.getRoleIdsForUsers(userIds);
  }

  validateRoleIds(roleIds: string[]) {
    return this.roleQueryUseCase.validateRoleIds(roleIds);
  }

  assertCanManageUserAccount(
    actor: AuthenticatedRequestUser,
    targetRoleNames: string[],
  ): void {
    assertCanManagePrivilegedAccount(actor, targetRoleNames);
  }

  assertCanAssignUserRoles(
    actor: AuthenticatedRequestUser,
    targetRoleNames: string[],
    desiredRoleNames: string[],
  ): void {
    assertCanAssignRoles(actor, targetRoleNames, desiredRoleNames);
  }

  getRoleByName(name: string, executor?: DatabaseExecutor) {
    return this.roleQueryUseCase.getRoleByName(name, null, executor);
  }

  getOrganizationRoleByName(
    name: string,
    organizationId: string,
    executor?: DatabaseExecutor,
  ) {
    return this.roleQueryUseCase.getRoleByName(name, organizationId, executor);
  }

  listRoles(actor?: AuthenticatedRequestUser) {
    return this.roleQueryUseCase.listRoles(actor);
  }

  listPermissions() {
    return this.roleQueryUseCase.listPermissions();
  }

  createRole(
    actor: AuthenticatedRequestUser,
    input: Parameters<RoleManagementUseCase['create']>[1],
    requestContext?: Parameters<RoleManagementUseCase['create']>[2],
  ) {
    return this.roleManagementUseCase.create(actor, input, requestContext);
  }

  updateRole(
    actor: AuthenticatedRequestUser,
    roleId: string,
    input: Parameters<RoleManagementUseCase['update']>[2],
    requestContext?: Parameters<RoleManagementUseCase['update']>[3],
  ) {
    return this.roleManagementUseCase.update(
      actor,
      roleId,
      input,
      requestContext,
    );
  }

  deleteRole(
    actor: AuthenticatedRequestUser,
    roleId: string,
    requestContext?: Parameters<RoleManagementUseCase['delete']>[2],
  ) {
    return this.roleManagementUseCase.delete(actor, roleId, requestContext);
  }

  ensureOrganizationAdminRole(
    organizationId: string,
    userId: string,
    executor?: DatabaseExecutor,
  ) {
    return this.roleManagementUseCase.ensureOrganizationAdminRole(
      organizationId,
      userId,
      executor,
    );
  }

  createPermission(
    actor: AuthenticatedRequestUser,
    input: Parameters<RoleManagementUseCase['createPermission']>[1],
    requestContext?: Parameters<RoleManagementUseCase['createPermission']>[2],
  ) {
    return this.roleManagementUseCase.createPermission(
      actor,
      input,
      requestContext,
    );
  }

  updatePermission(
    actor: AuthenticatedRequestUser,
    permissionId: string,
    input: Parameters<RoleManagementUseCase['updatePermission']>[2],
    requestContext?: Parameters<RoleManagementUseCase['updatePermission']>[3],
  ) {
    return this.roleManagementUseCase.updatePermission(
      actor,
      permissionId,
      input,
      requestContext,
    );
  }

  deletePermission(
    actor: AuthenticatedRequestUser,
    permissionId: string,
    requestContext?: Parameters<RoleManagementUseCase['deletePermission']>[2],
  ) {
    return this.roleManagementUseCase.deletePermission(
      actor,
      permissionId,
      requestContext,
    );
  }

  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId?: string | null,
    executor?: DatabaseExecutor,
  ) {
    return this.replaceUserRolesUseCase.execute(
      userId,
      roleIds,
      organizationId,
      executor,
    );
  }
}
