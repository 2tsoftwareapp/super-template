import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';

import { ADMIN_PERMISSIONS, ROLE_NAMES } from '../access-control.constants';
import {
  assertCanManageRoleCatalog,
  assertRoleNameIsNotReserved,
} from '../domain/role-assignment.policy';
import type {
  CreateRoleCommand,
  CreatePermissionCommand,
  PermissionView,
  RoleView,
  UpdatePermissionCommand,
  UpdateRoleCommand,
} from './access-control.types';
import { AccessProfileUseCase } from './access-profile.use-case';
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from './access-control.repository.port';
import { RoleQueryUseCase } from './role-query.use-case';

@Injectable()
export class RoleManagementUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly accessProfileUseCase: AccessProfileUseCase,
    private readonly roleQueryUseCase: RoleQueryUseCase,
  ) {}

  async create(
    actor: AuthenticatedRequestUser,
    input: CreateRoleCommand,
    requestContext?: RequestContext,
  ): Promise<RoleView> {
    const name = normalizeRoleName(input.name);
    assertRoleNameIsNotReserved(name);

    const organizationId = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)
      ? (input.organizationId ?? null)
      : actor.organizationId;

    assertCanManageRoleCatalog(actor, null, organizationId);
    await this.assertPermissionIdsExist(input.permissionIds);

    const createdRoleId = await runInTransaction(
      this.database,
      async (transaction) => {
        const role = await this.accessControlRepository.createRole(
          {
            name,
            description: input.description?.trim() || null,
            organizationId,
            isSystem: false,
          },
          transaction,
        );

        if (!role) {
          throw new AppError(
            ERROR_CODES.INTERNAL_ERROR,
            'Role could not be created',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        await this.accessControlRepository.replaceRolePermissions(
          role.id,
          input.permissionIds,
          transaction,
        );
        await this.auditWriter.log(
          {
            actorId: actor.userId,
            action: 'role.created',
            entityType: 'role',
            entityId: role.id,
            metadata: { organizationId, permissionIds: input.permissionIds },
            requestContext,
          },
          transaction,
        );

        return role.id;
      },
    );

    return this.getRoleView(createdRoleId);
  }

  async update(
    actor: AuthenticatedRequestUser,
    roleId: string,
    input: UpdateRoleCommand,
    requestContext?: RequestContext,
  ): Promise<RoleView> {
    const role = await this.findExistingRole(roleId);
    assertCanManageRoleCatalog(actor, role, role.organizationId);

    if (input.name) {
      const nextName = normalizeRoleName(input.name);
      if (nextName !== role.name) {
        assertRoleNameIsNotReserved(nextName);
      }
    }

    if (input.permissionIds) {
      await this.assertPermissionIdsExist(input.permissionIds);
    }

    await runInTransaction(this.database, async (transaction) => {
      await this.accessControlRepository.updateRole(
        roleId,
        {
          name: input.name ? normalizeRoleName(input.name) : role.name,
          description:
            input.description === undefined
              ? role.description
              : input.description?.trim() || null,
        },
        transaction,
      );

      if (input.permissionIds) {
        await this.accessControlRepository.replaceRolePermissions(
          roleId,
          input.permissionIds,
          transaction,
        );
        await this.accessProfileUseCase.invalidateUsersForRole(
          roleId,
          transaction,
        );
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'role.updated',
          entityType: 'role',
          entityId: roleId,
          metadata: { permissionIds: input.permissionIds },
          requestContext,
        },
        transaction,
      );
    });

    return this.getRoleView(roleId);
  }

  async delete(
    actor: AuthenticatedRequestUser,
    roleId: string,
    requestContext?: RequestContext,
  ): Promise<void> {
    const role = await this.findExistingRole(roleId);
    assertCanManageRoleCatalog(actor, role, role.organizationId);

    await runInTransaction(this.database, async (transaction) => {
      await this.accessProfileUseCase.invalidateUsersForRole(roleId, transaction);
      await this.accessControlRepository.deleteRole(roleId, transaction);
      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'role.deleted',
          entityType: 'role',
          entityId: roleId,
          metadata: { organizationId: role.organizationId },
          requestContext,
        },
        transaction,
      );
    });
  }

  async ensureOrganizationAdminRole(
    organizationId: string,
    userId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    const permissions =
      await this.accessControlRepository.findPermissionsByNames(
        [...ADMIN_PERMISSIONS],
        executor,
      );
    let role = await this.accessControlRepository.findRoleByName(
      ROLE_NAMES.ADMIN,
      organizationId,
      executor,
    );

    if (!role) {
      role = await this.accessControlRepository.createRole(
        {
          name: ROLE_NAMES.ADMIN,
          description: 'Organization administrator role',
          organizationId,
          isSystem: true,
        },
        executor,
      );
    }

    if (!role) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Organization admin role could not be created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.accessControlRepository.replaceRolePermissions(
      role.id,
      permissions.map((permission) => permission.id),
      executor,
    );
    await this.accessControlRepository.assignUserRole(
      userId,
      role.id,
      organizationId,
      executor,
    );
    await this.accessProfileUseCase.invalidateAccessProfile(userId);
  }

  async createPermission(
    actor: AuthenticatedRequestUser,
    input: CreatePermissionCommand,
    requestContext?: RequestContext,
  ): Promise<PermissionView> {
    assertCanManageRoleCatalog(actor, null, actor.organizationId);
    const permission = await this.accessControlRepository.createPermission({
      name: normalizePermissionName(input.name),
      description: input.description?.trim() || null,
      isSystem: false,
    });

    if (!permission) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Permission could not be created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'permission.created',
      entityType: 'permission',
      entityId: permission.id,
      metadata: { name: permission.name },
      requestContext,
    });

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      isSystem: permission.isSystem,
    };
  }

  async updatePermission(
    actor: AuthenticatedRequestUser,
    permissionId: string,
    input: UpdatePermissionCommand,
    requestContext?: RequestContext,
  ): Promise<PermissionView> {
    assertCanManageRoleCatalog(actor, null, actor.organizationId);
    const existing = await this.findExistingPermission(permissionId);

    if (existing.isSystem) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'System permissions cannot be edited',
        HttpStatus.FORBIDDEN,
      );
    }

    const permission = await this.accessControlRepository.updatePermission(
      permissionId,
      {
        name: input.name ? normalizePermissionName(input.name) : existing.name,
        description:
          input.description === undefined
            ? existing.description
            : input.description?.trim() || null,
      },
    );

    if (!permission) {
      throw new AppError(
        ERROR_CODES.PERMISSION_NOT_FOUND,
        'Permission not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.accessProfileUseCase.invalidateUsersForPermission(permissionId);
    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'permission.updated',
      entityType: 'permission',
      entityId: permissionId,
      requestContext,
    });

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      isSystem: permission.isSystem,
    };
  }

  async deletePermission(
    actor: AuthenticatedRequestUser,
    permissionId: string,
    requestContext?: RequestContext,
  ): Promise<void> {
    assertCanManageRoleCatalog(actor, null, actor.organizationId);
    const existing = await this.findExistingPermission(permissionId);

    if (existing.isSystem) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'System permissions cannot be deleted',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.accessProfileUseCase.invalidateUsersForPermission(permissionId);
    await this.accessControlRepository.deletePermission(permissionId);
    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'permission.deleted',
      entityType: 'permission',
      entityId: permissionId,
      requestContext,
    });
  }

  private async findExistingRole(roleId: string) {
    const role = await this.accessControlRepository.findRoleById(roleId);

    if (!role) {
      throw new AppError(
        ERROR_CODES.PERMISSION_NOT_FOUND,
        'Role not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return role;
  }

  private async findExistingPermission(permissionId: string) {
    const permission =
      await this.accessControlRepository.findPermissionById(permissionId);

    if (!permission) {
      throw new AppError(
        ERROR_CODES.ROLE_NOT_FOUND,
        'Permission not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return permission;
  }

  private async assertPermissionIdsExist(permissionIds: string[]) {
    const permissions =
      await this.accessControlRepository.findPermissionsByIds(permissionIds);

    if (permissions.length !== permissionIds.length) {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'One or more permissions do not exist',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async getRoleView(roleId: string) {
    const roles = await this.roleQueryUseCase.listRoles();
    const role = roles.find((candidate) => candidate.id === roleId);

    if (!role) {
      throw new AppError(
        ERROR_CODES.ROLE_NOT_FOUND,
        'Role not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return role;
  }
}

function normalizeRoleName(name: string) {
  return name.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_');
}

function normalizePermissionName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9.:-]+/g, '.');
}
