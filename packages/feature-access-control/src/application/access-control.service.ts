import type { AuthenticatedRequestUser } from "@repo/api-runtime";
import type { TransactionExecutor } from "@repo/api-runtime";

import { Injectable } from "@nestjs/common";

import {
  assertCanAssignRoles,
  assertCanManagePrivilegedAccount,
} from "../domain/role-assignment.policy";
import { AccessProfileUseCase } from "./use-cases/access-profile.use-case";
import { ReplaceUserRolesUseCase } from "./use-cases/replace-user-roles.use-case";
import { RoleManagementUseCase } from "./use-cases/role-management.use-case";
import { RoleQueryUseCase } from "./use-cases/role-query.use-case";
import { SeedAccessControlUseCase } from "./use-cases/seed-access-control.use-case";

export type { AccessProfileView, RoleView as RoleDto } from "./access-control.types";

@Injectable()
export class AccessControlService {
  constructor(
    private readonly seedAccessControlUseCase: SeedAccessControlUseCase,
    private readonly accessProfileUseCase: AccessProfileUseCase,
    private readonly roleQueryUseCase: RoleQueryUseCase,
    private readonly roleManagementUseCase: RoleManagementUseCase,
    private readonly replaceUserRolesUseCase: ReplaceUserRolesUseCase,
  ) {}

  ensureSeedData(executor?: TransactionExecutor) {
    return this.seedAccessControlUseCase.execute(executor);
  }

  getAccessProfile(userId: string, organizationId?: string | null) {
    return this.accessProfileUseCase.getAccessProfile(userId, organizationId);
  }

  invalidateAccessProfile(userId: string) {
    return this.accessProfileUseCase.invalidateAccessProfile(userId);
  }

  getRoleNamesForUsers(userIds: string[], organizationId?: string | null) {
    return this.roleQueryUseCase.getRoleNamesForUsers(userIds, organizationId);
  }

  getRoleIdsForUser(userId: string, organizationId?: string | null) {
    return this.roleQueryUseCase.getRoleIdsForUser(userId, organizationId);
  }

  getRoleAssignmentsForUser(userId: string, organizationId?: string | null) {
    return this.roleQueryUseCase.getRoleAssignmentsForUser(userId, organizationId);
  }

  getRoleIdsForUsers(userIds: string[], organizationId?: string | null) {
    return this.roleQueryUseCase.getRoleIdsForUsers(userIds, organizationId);
  }

  validateRoleIds(roleIds: string[]) {
    return this.roleQueryUseCase.validateRoleIds(roleIds);
  }

  assertCanManageUserAccount(actor: AuthenticatedRequestUser, targetRoleNames: string[]): void {
    assertCanManagePrivilegedAccount(actor, targetRoleNames);
  }

  assertCanAssignUserRoles(
    actor: AuthenticatedRequestUser,
    targetRoleNames: string[],
    desiredRoleNames: string[],
  ): void {
    assertCanAssignRoles(actor, targetRoleNames, desiredRoleNames);
  }

  getRoleById(roleId: string, executor?: TransactionExecutor) {
    return this.roleQueryUseCase.getRoleById(roleId, executor);
  }

  getRoleByName(name: string, organizationId?: string | null, executor?: TransactionExecutor) {
    return this.roleQueryUseCase.getRoleByName(name, organizationId ?? null, executor);
  }

  getOrganizationRoleByName(name: string, organizationId: string, executor?: TransactionExecutor) {
    return this.roleQueryUseCase.getRoleByName(name, organizationId, executor);
  }

  ensureOrganizationAdminRole(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ) {
    return this.roleManagementUseCase.ensureOrganizationAdminRole(organizationId, userId, executor);
  }

  replaceUserRoles(
    userId: string,
    roleIds: string[],
    organizationId: string | null,
    executor?: TransactionExecutor,
  ) {
    return this.replaceUserRolesUseCase.execute(userId, roleIds, organizationId, executor);
  }
}
