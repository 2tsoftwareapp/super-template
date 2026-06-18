import type { DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import {
  ADMIN_PERMISSIONS,
  ALL_PERMISSIONS as ALL_PERMISSION_NAMES,
  ROLE_NAMES,
  USER_PERMISSIONS,
} from '../access-control.constants';
import {
  PERMISSION_SEED_ENTRIES,
  ROLE_SEED_ENTRIES,
} from '../domain/access-control-seed.catalog';
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from './access-control.repository.port';
import { AccessProfileUseCase } from './access-profile.use-case';

@Injectable()
export class SeedAccessControlUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileUseCase: AccessProfileUseCase,
  ) {}

  async execute(executor?: DatabaseExecutor): Promise<void> {
    const roles = await this.accessControlRepository.ensureRoles(
      ROLE_SEED_ENTRIES,
      executor,
    );

    const permissions = await this.accessControlRepository.ensurePermissions(
      PERMISSION_SEED_ENTRIES,
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

    await this.accessProfileUseCase.invalidateUsersForRole(
      superAdminRole.id,
      executor,
    );
    await this.accessProfileUseCase.invalidateUsersForRole(
      adminRole.id,
      executor,
    );
    await this.accessProfileUseCase.invalidateUsersForRole(
      userRole.id,
      executor,
    );
  }
}
