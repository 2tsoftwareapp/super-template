import type { DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { AuthenticatedRequestUser } from '@repo/api-core';

import { ROLE_NAMES } from '../access-control.constants';
import type { PermissionView, RoleView } from './access-control.types';

import { AccessControlMapper } from './access-control.mapper';
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from './access-control.repository.port';

@Injectable()
export class RoleQueryUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessControlMapper: AccessControlMapper,
  ) {}

  async getRoleNamesForUsers(userIds: string[]) {
    const rows =
      await this.accessControlRepository.findRoleNamesForUsers(userIds);
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

  getRoleIdsForUser(userId: string) {
    return this.accessControlRepository.findRoleIdsForUser(userId);
  }

  async getRoleIdsForUsers(userIds: string[]) {
    const rows =
      await this.accessControlRepository.findRoleIdsForUsers(userIds);
    const grouped = new Map<string, string[]>();

    for (const row of rows) {
      const existing = grouped.get(row.userId) ?? [];
      existing.push(row.roleId);
      grouped.set(row.userId, existing);
    }

    return grouped;
  }

  async validateRoleIds(roleIds: string[]) {
    const foundRoles =
      await this.accessControlRepository.findRolesByIds(roleIds);

    if (foundRoles.length !== roleIds.length) {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'One or more roles do not exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    return foundRoles;
  }

  getRoleByName(
    name: string,
    organizationId: string | null = null,
    executor?: DatabaseExecutor,
  ) {
    return this.accessControlRepository.findRoleByName(
      name,
      organizationId,
      executor,
    );
  }

  async listRoles(actor?: AuthenticatedRequestUser): Promise<RoleView[]> {
    const roles = actor
      ? await this.accessControlRepository.findManageableRolesForActor(
          actor.organizationId,
          actor.roles.includes(ROLE_NAMES.SUPER_ADMIN),
        )
      : await this.accessControlRepository.findAllRoles();
    const permissionRows =
      await this.accessControlRepository.findPermissionsForRoleIds(
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
      });
      permissionsByRoleId.set(row.roleId, existing);
    }

    return roles.map((role) =>
      this.accessControlMapper.toRoleView(
        role,
        permissionsByRoleId.get(role.id) ?? [],
      ),
    );
  }

  async listPermissions(): Promise<PermissionView[]> {
    const permissions = await this.accessControlRepository.findAllPermissions();

    return permissions.map((permission) =>
      this.accessControlMapper.toPermissionView(permission),
    );
  }
}
