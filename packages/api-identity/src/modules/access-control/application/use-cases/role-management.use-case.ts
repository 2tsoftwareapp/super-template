import type { AuthenticatedRequestUser } from '@repo/api-core';
import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  ERROR_CODES,
  isFixedRoleName,
  permissionNamesForRole,
  ROLE_NAMES,
} from '@repo/api-core';
import { DATABASE } from '@repo/api-database';

import type {
  CreateRoleCommand,
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

@Injectable()
export class RoleManagementUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileUseCase: AccessProfileUseCase,
    private readonly accessControlMapper: AccessControlMapper,
  ) {}

  async ensureOrganizationAdminRole(
    organizationId: string,
    userId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    const permissions =
      await this.accessControlRepository.findPermissionsByNames(
        permissionNamesForRole(ROLE_NAMES.ADMIN),
        executor,
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
    executor: DatabaseExecutor = this.database,
  ): Promise<RoleView> {
    const organizationId = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)
      ? (command.organizationId ?? actor.organizationId ?? null)
      : (actor.organizationId ?? null);

    assertCanCreateCustomRole(actor, organizationId);

    if (isFixedRoleName(command.name)) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Custom roles cannot use system role names',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingRole = await this.accessControlRepository.findRoleByName(
      command.name,
      organizationId,
      executor,
    );

    if (existingRole) {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'A role with this name already exists in the organization',
        HttpStatus.CONFLICT,
      );
    }

    const permissions = await this.resolveCatalogPermissions(
      command.permissionIds,
      executor,
    );

    const role = await this.accessControlRepository.createRole(
      {
        name: command.name,
        description: command.description ?? null,
        organizationId,
        isSystem: false,
      },
      executor,
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
      executor,
    );

    return this.accessControlMapper.toRoleView(
      role,
      permissions.map((permission) =>
        this.accessControlMapper.toPermissionView(permission),
      ),
    );
  }

  async updateCustomRole(
    actor: AuthenticatedRequestUser,
    roleId: string,
    command: UpdateRoleCommand,
    executor: DatabaseExecutor = this.database,
  ): Promise<RoleView> {
    const role = await this.accessControlRepository.findRoleById(roleId, executor);

    if (!role) {
      throw new AppError(
        ERROR_CODES.ROLE_NOT_FOUND,
        'Role not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertCanModifyCustomRole(actor, role);

    if (command.name && command.name !== role.name) {
      if (isFixedRoleName(command.name)) {
        throw new AppError(
          ERROR_CODES.VALIDATION_FAILED,
          'Custom roles cannot use system role names',
          HttpStatus.BAD_REQUEST,
        );
      }

      const existingRole = await this.accessControlRepository.findRoleByName(
        command.name,
        role.organizationId,
        executor,
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
        ...(command.name !== undefined ? { name: command.name } : {}),
        ...(command.description !== undefined
          ? { description: command.description }
          : {}),
      },
      executor,
    );

    if (!updatedRole) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Custom role could not be updated',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    let permissions = await this.loadPermissionsForRole(roleId, executor);

    if (command.permissionIds) {
      permissions = await this.resolveCatalogPermissions(
        command.permissionIds,
        executor,
      );

      await this.accessControlRepository.replaceRolePermissions(
        roleId,
        permissions.map((permission) => permission.id),
        executor,
      );
      await this.accessProfileUseCase.invalidateUsersForRole(roleId, executor);
    }

    return this.accessControlMapper.toRoleView(
      updatedRole,
      permissions.map((permission) =>
        this.accessControlMapper.toPermissionView(permission),
      ),
    );
  }

  async replaceCustomRolePermissions(
    actor: AuthenticatedRequestUser,
    roleId: string,
    permissionIds: string[],
    executor: DatabaseExecutor = this.database,
  ): Promise<RoleView> {
    return this.updateCustomRole(
      actor,
      roleId,
      { permissionIds },
      executor,
    );
  }

  async deleteCustomRole(
    actor: AuthenticatedRequestUser,
    roleId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    const role = await this.accessControlRepository.findRoleById(roleId, executor);

    if (!role) {
      throw new AppError(
        ERROR_CODES.ROLE_NOT_FOUND,
        'Role not found',
        HttpStatus.NOT_FOUND,
      );
    }

    assertCanModifyCustomRole(actor, role);

    const assignedUserIds =
      await this.accessControlRepository.findUserIdsForRole(roleId, executor);

    if (assignedUserIds.length > 0) {
      throw new AppError(
        ERROR_CODES.RESOURCE_CONFLICT,
        'Custom roles assigned to users cannot be deleted',
        HttpStatus.CONFLICT,
      );
    }

    await this.accessControlRepository.deleteRole(roleId, executor);
  }

  private async resolveCatalogPermissions(
    permissionIds: string[],
    executor: DatabaseExecutor,
  ) {
    const permissions = await this.accessControlRepository.findPermissionsByIds(
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

    const invalidPermission = permissions.find((permission) => !permission.isSystem);

    if (invalidPermission) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'Custom roles can only use system catalog permissions',
        HttpStatus.BAD_REQUEST,
      );
    }

    return permissions;
  }

  private async loadPermissionsForRole(
    roleId: string,
    executor: DatabaseExecutor,
  ) {
    const permissionIds =
      await this.accessControlRepository.findPermissionIdsForRole(
        roleId,
        executor,
      );

    return this.accessControlRepository.findPermissionsByIds(
      permissionIds,
      executor,
    );
  }
}
