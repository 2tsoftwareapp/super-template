import type { DatabaseClient, DatabaseExecutor } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';
import { DATABASE } from '@repo/api-database';

import { ADMIN_PERMISSIONS, ROLE_NAMES } from '../access-control.constants';
import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from './access-control.repository.port';
import { AccessProfileUseCase } from './access-profile.use-case';

@Injectable()
export class RoleManagementUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileUseCase: AccessProfileUseCase,
  ) {}

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
}
