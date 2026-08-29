import type { AuthenticatedRequestUser } from "@repo/api-runtime";
import type { TransactionExecutor } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";

import type { PermissionView, RoleView } from "../access-control.types";

import { ROLE_NAMES } from "../../access-control.constants";
import { AccessControlMapper } from "../access-control.mapper";
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../ports/access-control.repository.port";

export interface ListRolesParams {
  page: number;
  limit: number;
  organizationId?: string | undefined;
  search?: string | undefined;
  scope?: "platform" | "organization" | undefined;
}

@Injectable()
export class RoleQueryUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessControlMapper: AccessControlMapper,
  ) {}

  async getRoleNamesForUsers(userIds: string[], organizationId?: string | null) {
    const rows = await this.accessControlRepository.findRoleNamesForUsers(userIds, organizationId);
    const grouped = new Map<string, string[]>();

    for (const row of rows) {
      const existing = grouped.get(row.userId) ?? [];
      if (!existing.includes(row.roleName)) {
        existing.push(row.roleName);
      }
      grouped.set(row.userId, existing);
    }

    return grouped;
  }

  getRoleIdsForUser(userId: string, organizationId?: string | null) {
    return this.accessControlRepository.findRoleIdsForUser(userId, organizationId);
  }

  getRoleAssignmentsForUser(userId: string, organizationId?: string | null) {
    return this.accessControlRepository.findRoleAssignmentsForUser(userId, organizationId);
  }

  async getRoleIdsForUsers(userIds: string[], organizationId?: string | null) {
    const rows = await this.accessControlRepository.findRoleIdsForUsers(userIds, organizationId);
    const grouped = new Map<string, string[]>();

    for (const row of rows) {
      const existing = grouped.get(row.userId) ?? [];
      existing.push(row.roleId);
      grouped.set(row.userId, existing);
    }

    return grouped;
  }

  async validateRoleIds(roleIds: string[]) {
    const foundRoles = await this.accessControlRepository.findRolesByIds(roleIds);

    if (foundRoles.length !== roleIds.length) {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        "One or more roles do not exist",
        HttpStatus.BAD_REQUEST,
      );
    }

    return foundRoles;
  }

  getRoleById(roleId: string, executor?: TransactionExecutor) {
    return this.accessControlRepository.findRoleById(roleId, executor);
  }

  getRoleByName(
    name: string,
    organizationId: string | null = null,
    executor?: TransactionExecutor,
  ) {
    return this.accessControlRepository.findRoleByName(name, organizationId, executor);
  }

  async listRoles(
    actor?: AuthenticatedRequestUser,
    params?: ListRolesParams,
  ): Promise<{ rows: RoleView[]; total: number }> {
    const isSuperAdmin = actor?.roles.includes(ROLE_NAMES.SUPER_ADMIN) ?? false;

    if (
      !isSuperAdmin &&
      params?.organizationId &&
      params.organizationId !== actor?.organizationId
    ) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "You can only list roles within your own organization",
        HttpStatus.FORBIDDEN,
      );
    }

    const { rows: roles, total } = await this.accessControlRepository.findRolesPaginated({
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
      organizationId: params?.organizationId,
      search: params?.search,
      scope: params?.scope,
      manageableByOrg: isSuperAdmin ? undefined : (actor?.organizationId ?? null),
    });

    if (roles.length === 0) {
      return { rows: [], total };
    }

    const permissionRows = await this.accessControlRepository.findPermissionsForRoleIds(
      roles.map((role) => role.id),
    );
    const permissionsByRoleId = new Map<string, PermissionView[]>();

    for (const row of permissionRows) {
      const existing = permissionsByRoleId.get(row.roleId) ?? [];
      existing.push({
        id: row.id,
        name: row.name,
        description: row.description,
        isSystem: row.isSystem,
        scope: row.scope as "platform" | "organization",
      });
      permissionsByRoleId.set(row.roleId, existing);
    }

    return {
      rows: roles.map((role) =>
        this.accessControlMapper.toRoleView(role, permissionsByRoleId.get(role.id) ?? []),
      ),
      total,
    };
  }

  async getUserIdsForRole(roleId: string): Promise<string[]> {
    return this.accessControlRepository.findUserIdsForRole(roleId);
  }

  async listPermissions(actor?: AuthenticatedRequestUser): Promise<PermissionView[]> {
    const permissions = await this.accessControlRepository.findAllPermissions();
    const isSuperAdmin = actor?.roles.includes(ROLE_NAMES.SUPER_ADMIN) ?? false;

    return permissions
      .map((permission) => this.accessControlMapper.toPermissionView(permission as PermissionView))
      .filter((permission) => isSuperAdmin || permission.scope === "organization");
  }
}
