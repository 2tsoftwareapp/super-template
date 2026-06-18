import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AccessProfileCache } from '@repo/api-core';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';

import {
  ADMIN_PERMISSIONS,
  ALL_PERMISSIONS as ALL_PERMISSION_NAMES,
  PERMISSION_NAMES,
  ROLE_NAMES,
  USER_PERMISSIONS,
} from '../access-control.constants';
import {
  assertCanAssignRoles,
  assertCanManagePrivilegedAccount,
} from '../domain/role-assignment.policy';
import { AccessControlRepository } from '../infrastructure/access-control.repository';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly accessControlRepository: AccessControlRepository,
    private readonly accessProfileCache: AccessProfileCache,
  ) {}

  async ensureSeedData(executor?: DatabaseExecutor): Promise<void> {
    // Seed the immutable role/permission graph in one place so every env uses the same policy baseline.
    const roles = await this.accessControlRepository.ensureRoles(
      [
        { name: ROLE_NAMES.SUPER_ADMIN, description: 'Platform owner role' },
        { name: ROLE_NAMES.ADMIN, description: 'Administrative role' },
        { name: ROLE_NAMES.USER, description: 'Standard user role' },
      ],
      executor,
    );

    const permissions = await this.accessControlRepository.ensurePermissions(
      [
        { name: PERMISSION_NAMES.USERS_READ, description: 'Read users' },
        { name: PERMISSION_NAMES.USERS_CREATE, description: 'Create users' },
        { name: PERMISSION_NAMES.USERS_UPDATE, description: 'Update users' },
        { name: PERMISSION_NAMES.USERS_DELETE, description: 'Delete users' },
        { name: PERMISSION_NAMES.ROLES_READ, description: 'Read roles' },
        { name: PERMISSION_NAMES.ROLES_MANAGE, description: 'Manage roles' },
        { name: PERMISSION_NAMES.PROJECTS_READ, description: 'Read projects' },
        {
          name: PERMISSION_NAMES.PROJECTS_CREATE,
          description: 'Create projects',
        },
        {
          name: PERMISSION_NAMES.PROJECTS_UPDATE,
          description: 'Update projects',
        },
        {
          name: PERMISSION_NAMES.PROJECTS_DELETE,
          description: 'Delete projects',
        },
        {
          name: PERMISSION_NAMES.NOTIFICATIONS_READ,
          description: 'Read notifications',
        },
        {
          name: PERMISSION_NAMES.NOTIFICATIONS_SEND,
          description: 'Send notifications',
        },
        { name: PERMISSION_NAMES.AUDIT_READ, description: 'Read audit logs' },
        {
          name: PERMISSION_NAMES.FILES_UPLOAD,
          description: 'Upload files',
        },
        { name: PERMISSION_NAMES.FILES_READ, description: 'Read files' },
        {
          name: PERMISSION_NAMES.FILES_DELETE,
          description: 'Delete files',
        },
        {
          name: PERMISSION_NAMES.ATTACHMENTS_MANAGE,
          description: 'Manage attachments',
        },
        {
          name: PERMISSION_NAMES.SETTINGS_MANAGE,
          description: 'Manage application settings',
        },
        {
          name: PERMISSION_NAMES.SETTINGS_READ,
          description: 'Read application settings',
        },
        { name: PERMISSION_NAMES.JOBS_READ, description: 'Read jobs' },
        { name: PERMISSION_NAMES.JOBS_MANAGE, description: 'Manage jobs' },
        {
          name: PERMISSION_NAMES.INVITATIONS_CREATE,
          description: 'Create invitations',
        },
        {
          name: PERMISSION_NAMES.INVITATIONS_READ,
          description: 'Read invitations',
        },
        {
          name: PERMISSION_NAMES.IMPORTS_MANAGE,
          description: 'Manage import jobs',
        },
        {
          name: PERMISSION_NAMES.EXPORTS_MANAGE,
          description: 'Manage export jobs',
        },
        {
          name: PERMISSION_NAMES.COMMENTS_READ,
          description: 'Read comments',
        },
        {
          name: PERMISSION_NAMES.COMMENTS_CREATE,
          description: 'Create comments',
        },
        {
          name: PERMISSION_NAMES.COMMENTS_MODERATE,
          description: 'Moderate comments',
        },
        {
          name: PERMISSION_NAMES.ACTIVITIES_READ,
          description: 'Read activities',
        },
        {
          name: PERMISSION_NAMES.PROJECTS_INVITE,
          description: 'Invite project collaborators',
        },
        {
          name: PERMISSION_NAMES.MAIL_READ,
          description: 'Read mail deliveries',
        },
      ],
      executor,
    );

    const roleByName = new Map(roles.map((role) => [role.name, role]));
    const permissionByName = new Map(
      permissions.map((permission) => [permission.name, permission]),
    );
    const allPermissionIds = ALL_PERMISSION_NAMES.map(
      (name) => permissionByName.get(name)?.id,
    ).filter(Boolean) as string[];
    const adminPermissionIds = ADMIN_PERMISSIONS.map(
      (name) => permissionByName.get(name)?.id,
    ).filter(Boolean) as string[];
    const userPermissionIds = USER_PERMISSIONS.map(
      (name) => permissionByName.get(name)?.id,
    ).filter(Boolean) as string[];
    const superAdminRole = roleByName.get(ROLE_NAMES.SUPER_ADMIN);
    const adminRole = roleByName.get(ROLE_NAMES.ADMIN);
    const userRole = roleByName.get(ROLE_NAMES.USER);

    if (!superAdminRole || !adminRole || !userRole) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Role seed state is inconsistent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.accessControlRepository.replaceRolePermissions(
      superAdminRole.id,
      allPermissionIds,
      executor,
    );
    await this.accessControlRepository.replaceRolePermissions(
      adminRole.id,
      adminPermissionIds,
      executor,
    );
    await this.accessControlRepository.replaceRolePermissions(
      userRole.id,
      userPermissionIds,
      executor,
    );
    await this.invalidateUsersForRole(superAdminRole.id, executor);
    await this.invalidateUsersForRole(adminRole.id, executor);
    await this.invalidateUsersForRole(userRole.id, executor);
  }

  async getAccessProfile(userId: string) {
    const cached = await this.accessProfileCache.get(userId);

    if (cached) {
      return cached;
    }

    const [roles, permissions] = await Promise.all([
      this.accessControlRepository.findRoleNamesForUser(userId),
      this.accessControlRepository.findPermissionNamesForUser(userId),
    ]);

    const profile = {
      roles,
      permissions,
    };

    await this.accessProfileCache.set(userId, profile);

    return profile;
  }

  async invalidateAccessProfile(userId: string): Promise<void> {
    await this.accessProfileCache.invalidateUser(userId);
  }

  private async invalidateUsersForRole(
    roleId: string,
    executor?: DatabaseExecutor,
  ): Promise<void> {
    const userIds = await this.accessControlRepository.findUserIdsForRole(
      roleId,
      executor,
    );

    await this.accessProfileCache.invalidateUsers(userIds);
  }

  async getRoleNamesForUsers(userIds: string[]) {
    // Group the flat join result by user so callers can render role badges without extra joins.
    const rows =
      await this.accessControlRepository.findRoleNamesForUsers(userIds);
    const grouped = new Map<string, string[]>();

    for (const row of rows) {
      const existing = grouped.get(row.userId) ?? [];
      existing.push(row.roleName);
      grouped.set(row.userId, existing);
    }

    return grouped;
  }

  async getRoleIdsForUser(userId: string) {
    return this.accessControlRepository.findRoleIdsForUser(userId);
  }

  async getRoleIdsForUsers(userIds: string[]) {
    // Same grouping strategy as names, but keeps the stable IDs needed for role editing.
    const rows = await this.accessControlRepository.findRoleIdsForUsers(userIds);
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

  async getRoleByName(name: string, executor?: DatabaseExecutor) {
    return this.accessControlRepository.findRoleByName(name, executor);
  }

  async listRoles() {
    const roles = await this.accessControlRepository.findAllRoles();

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  }

  async replaceUserRoles(
    userId: string,
    roleIds: string[],
    executor?: DatabaseExecutor,
  ) {
    await this.accessControlRepository.replaceUserRoles(
      userId,
      roleIds,
      executor,
    );
    await this.accessProfileCache.invalidateUser(userId);
  }
}
