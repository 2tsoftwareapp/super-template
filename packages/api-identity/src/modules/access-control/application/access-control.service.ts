import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';

import {
  assertCanAssignRoles,
  assertCanManagePrivilegedAccount,
} from '../domain/role-assignment.policy';
import { AccessProfileUseCase } from './access-profile.use-case';
import { ReplaceUserRolesUseCase } from './replace-user-roles.use-case';
import { RoleQueryUseCase } from './role-query.use-case';
import { SeedAccessControlUseCase } from './seed-access-control.use-case';

export type { AccessProfileView, RoleView as RoleDto } from './access-control.types';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly seedAccessControlUseCase: SeedAccessControlUseCase,
    private readonly accessProfileUseCase: AccessProfileUseCase,
    private readonly roleQueryUseCase: RoleQueryUseCase,
    private readonly replaceUserRolesUseCase: ReplaceUserRolesUseCase,
  ) {}

  ensureSeedData(executor?: DatabaseExecutor) {
    return this.seedAccessControlUseCase.execute(executor);
  }

  getAccessProfile(userId: string) {
    return this.accessProfileUseCase.getAccessProfile(userId);
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
    return this.roleQueryUseCase.getRoleByName(name, executor);
  }

  listRoles() {
    return this.roleQueryUseCase.listRoles();
  }

  replaceUserRoles(
    userId: string,
    roleIds: string[],
    executor?: DatabaseExecutor,
  ) {
    return this.replaceUserRolesUseCase.execute(userId, roleIds, executor);
  }
}
