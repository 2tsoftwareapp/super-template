import type { AuthenticatedRequestUser, JsonValue } from '@repo/api-core';
import type { AuditWriter, TransactionExecutor, TransactionPort } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  ERROR_CODES,
  isFixedRoleName,
  isPlatformPermission,
  permissionNamesForRole,
  ROLE_NAMES,
  TRANSACTION_PORT,
} from '@repo/api-core';

import type {
  CreateRoleCommand,
  PermissionView,
  RoleView,
  UpdateRoleCommand,
} from '../access-control.types';

import {
  assertCanCreateCustomRole,
  assertCanModifyCustomRole,
} from '../../domain/role-assignment.policy';
import { AccessControlMapper } from '../access-control.mapper';
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from '../access-control.repository.port';
import { AccessProfileUseCase } from './access-profile.use-case';

function normalizeRoleName(name: string): string {
  return name.trim().toUpperCase();
}

@Injectable()
export class RoleManagementUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    @Inject(TRANSACTION_PORT)
    private readonly transactionPort: TransactionPort,
    @Inject(AUDIT_WRITER)
    private readonly auditWriter: AuditWriter,
    private readonly accessProfileUseCase: AccessProfileUseCase,
    private readonly accessControlMapper: AccessControlMapper,
  ) {}

  async ensureOrganizationAdminRole(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const allPermissions =
      await this.accessControlRepository.findPermissionsByNames(
        permissionNamesForRole(ROLE_NAMES.ADMIN),
        executor,
      );
    const permissions = allPermissions.filter(
      (p) => !isPlatformPermission(p.name),
    );
    let role = await this.accessControlRepository.findRoleByName(
      ROLE_NAMES.ADMIN,
      organizationId,
      executor,
    );

    role ??= await this.accessControlRepository.createRole(
      {
        name: ROLE_NAMES.ADMIN,
        description: 'Organization administrator role',
        organizationId,
        isSystem: true,
      },
      executor,
    );

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

  async createCustomRole(
    actor: AuthenticatedRequestUser,
    command: CreateRoleCommand,
    _executor?: TransactionExecutor,
  ): Promise<RoleView> {
    const isSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    const organizationId: string | null = isSuperAdmin
      ? (command.organizationId ?? null)
      : (actor.organizationId ?? null);

    if (isSuperAdmin && !organizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Organization ID is required when creating a role',
        HttpStatus.BAD_REQUEST,
      );
    }

    assertCanCreateCustomRole(actor, organizationId);

    return this.transactionPort.run(async (tx) => {
      const normalizedName = normalizeRoleName(command.name);

      if (isFixedRoleName(normalizedName)) {
        throw new AppError(
          ERROR_CODES.VALIDATION_FAILED,
          'Custom roles cannot use system role names',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingRole = await this.accessControlRepository.findRoleByName(
        normalizedName,
        organizationId,
        tx,
      );

      if (existingRole) {
        throw new AppError(
          ERROR_CODES.RESOURCE_CONFLICT,
          'A role with this name already exists in the organization',
          HttpStatus.CONFLICT,
        );
      }

      const permissions = await this.resolveCatalogPermissions(
        actor,
        command.permissionIds,
        organizationId,
        tx,
      );

      const role = await this.accessControlRepository.createRole(
        {
          name: normalizedName,
          description: command.description ?? '',
          organizationId,
          isSystem: false,
        },
        tx,
      );

      if (!role) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Custom role could not be created',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      await this.accessControlRepository.replaceRolePermissions(
        role.id,
        permissions.map((permission) => permission.id),
        tx,
      );

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'role.created',
          entityType: 'role',
          entityId: role.id,
          metadata: {
            name: normalizedName,
            organizationId,
            permissionIds: command.permissionIds,
          },
        },
        tx,
      );

      return this.accessControlMapper.toRoleView(
        role,
        permissions.map((permission) =>
          this.accessControlMapper.toPermissionView(permission),
        ),
      );
    });
  }

  async updateCustomRole(
    actor: AuthenticatedRequestUser,
    roleId: string,
    command: UpdateRoleCommand,
    _executor?: TransactionExecutor,
  ): Promise<RoleView> {
    return this.transactionPort.run(async (tx) => {
      const role = await this.accessControlRepository.findRoleById(roleId, tx);

      if (!role) {
        throw new AppError(
          ERROR_CODES.ROLE_NOT_FOUND,
          'Role not found',
          HttpStatus.NOT_FOUND,
        );
      }

      assertCanModifyCustomRole(actor, role);

      const newName = command.name !== undefined
        ? normalizeRoleName(command.name)
        : undefined;

      if (newName !== undefined && newName !== role.name) {
        if (isFixedRoleName(newName)) {
          throw new AppError(
            ERROR_CODES.VALIDATION_FAILED,
            'Custom roles cannot use system role names',
            HttpStatus.BAD_REQUEST,
          );
        }

        const existingRole = await this.accessControlRepository.findRoleByName(
          newName,
          role.organizationId,
          tx,
        );

        if (existingRole && existingRole.id !== role.id) {
          throw new AppError(
            ERROR_CODES.RESOURCE_CONFLICT,
            'A role with this name already exists in the organization',
            HttpStatus.CONFLICT,
          );
        }
      }

      const updatedRole = await this.accessControlRepository.updateRole(
        roleId,
        {
          ...(newName !== undefined ? { name: newName } : {}),
          ...(command.description !== undefined
            ? { description: command.description }
            : {}),
        },
        tx,
      );

      if (!updatedRole) {
        throw new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Custom role could not be updated',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      let permissions: PermissionView[] = [];

      if (command.permissionIds) {
        permissions = await this.resolveCatalogPermissions(
          actor,
          command.permissionIds,
          role.organizationId,
          tx,
        );

        await this.accessControlRepository.replaceRolePermissions(
          roleId,
          permissions.map((permission) => permission.id),
          tx,
        );
        await this.accessProfileUseCase.invalidateUsersForRole(roleId, tx);
      } else {
        permissions = await this.loadPermissionsForRole(roleId, tx);
      }

      const updateMeta: Record<string, JsonValue> = {};

      if (newName !== undefined) {
        updateMeta.name = newName;
      }

      if (command.permissionIds) {
        updateMeta.permissionIds = command.permissionIds;
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'role.updated',
          entityType: 'role',
          entityId: roleId,
          metadata: updateMeta,
        },
        tx,
      );

      return this.accessControlMapper.toRoleView(
        updatedRole,
        permissions.map((permission) =>
          this.accessControlMapper.toPermissionView(permission),
        ),
      );
    });
  }

  async replaceCustomRolePermissions(
    actor: AuthenticatedRequestUser,
    roleId: string,
    permissionIds: string[],
    _executor?: TransactionExecutor,
  ): Promise<RoleView> {
    return this.updateCustomRole(
      actor,
      roleId,
      { permissionIds },
      _executor,
    );
  }

  async deleteCustomRole(
    actor: AuthenticatedRequestUser,
    roleId: string,
    _executor?: TransactionExecutor,
  ): Promise<void> {
    return this.transactionPort.run(async (tx) => {
      const role =
        await this.accessControlRepository.findRoleByIdWithLock(
          roleId,
          tx,
        );

      if (!role) {
        throw new AppError(
          ERROR_CODES.ROLE_NOT_FOUND,
          'Role not found',
          HttpStatus.NOT_FOUND,
        );
      }

      assertCanModifyCustomRole(actor, role);

      const assignedUserIds =
        await this.accessControlRepository.findUserIdsForRole(roleId, tx);

      if (assignedUserIds.length > 0) {
        throw new AppError(
          ERROR_CODES.RESOURCE_CONFLICT,
          'Custom roles assigned to users cannot be deleted',
          HttpStatus.CONFLICT,
        );
      }

      await this.accessControlRepository.deleteRole(roleId, tx);

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'role.deleted',
          entityType: 'role',
          entityId: roleId,
          metadata: {
            name: role.name,
            organizationId: role.organizationId,
          },
        },
        tx,
      );
    });
  }

  private async resolveCatalogPermissions(
    actor: AuthenticatedRequestUser,
    permissionIds: string[],
    targetOrganizationId: string | null,
    executor?: TransactionExecutor,
  ): Promise<PermissionView[]> {
    const permissions =
      await this.accessControlRepository.findPermissionsByIds(
        permissionIds,
        executor,
      );

    if (permissions.length !== permissionIds.length) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'One or more permissions do not exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    const invalidPermission = permissions.find(
      (permission) => !permission.isSystem,
    );

    if (invalidPermission) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Custom roles can only use system catalog permissions',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isOrgScoped = targetOrganizationId !== null;

    for (const permission of permissions) {
      if (isOrgScoped && isPlatformPermission(permission.name)) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          `Permission "${permission.name}" is platform-scoped and cannot be assigned to organization roles`,
          HttpStatus.FORBIDDEN,
        );
      }
    }

    if (!actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
      const actorPermissionSet = new Set(actor.permissions ?? []);

      for (const permission of permissions) {
        if (!actorPermissionSet.has(permission.name)) {
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            `You do not have the "${permission.name}" permission to delegate it`,
            HttpStatus.FORBIDDEN,
          );
        }
      }
    }

    return permissions.map((p) =>
      this.accessControlMapper.toPermissionView(p as PermissionView),
    );
  }

  private async loadPermissionsForRole(
    roleId: string,
    executor?: TransactionExecutor,
  ): Promise<PermissionView[]> {
    const permissionIds =
      await this.accessControlRepository.findPermissionIdsForRole(
        roleId,
        executor,
      );

    const rows = await this.accessControlRepository.findPermissionsByIds(
      permissionIds,
      executor,
    );

    return rows.map((p) =>
      this.accessControlMapper.toPermissionView(p as PermissionView),
    );
  }
}
