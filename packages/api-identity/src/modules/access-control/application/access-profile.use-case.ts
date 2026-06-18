import type { DatabaseExecutor } from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { AccessProfileCache } from '@repo/api-core';

import type { AccessProfileView } from './access-control.types';

import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from './access-control.repository.port';

@Injectable()
export class AccessProfileUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileCache: AccessProfileCache,
  ) {}

  async getAccessProfile(userId: string): Promise<AccessProfileView> {
    const cached = await this.accessProfileCache.get(userId);

    if (cached) {
      return cached;
    }

    const [roles, permissions] = await Promise.all([
      this.accessControlRepository.findRoleNamesForUser(userId),
      this.accessControlRepository.findPermissionNamesForUser(userId),
    ]);

    const profile: AccessProfileView = {
      roles,
      permissions,
    };

    await this.accessProfileCache.set(userId, profile);

    return profile;
  }

  async invalidateAccessProfile(userId: string): Promise<void> {
    await this.accessProfileCache.invalidateUser(userId);
  }

  async invalidateUsersForRole(
    roleId: string,
    executor?: DatabaseExecutor,
  ): Promise<void> {
    const userIds = await this.accessControlRepository.findUserIdsForRole(
      roleId,
      executor,
    );

    await this.accessProfileCache.invalidateUsers(userIds);
  }
}
