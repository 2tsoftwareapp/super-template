import type { TransactionExecutor } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { AccessProfileCache } from "@repo/api-runtime";

import type { AccessProfileView } from "../access-control.types";

import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "../ports/access-control.repository.port";

@Injectable()
export class AccessProfileUseCase {
  constructor(
    @Inject(ACCESS_CONTROL_REPOSITORY)
    private readonly accessControlRepository: AccessControlRepositoryPort,
    private readonly accessProfileCache: AccessProfileCache,
  ) {}

  async getAccessProfile(
    userId: string,
    organizationId?: string | null,
  ): Promise<AccessProfileView> {
    const cached = await this.accessProfileCache.get(userId, organizationId);

    if (cached) {
      return cached;
    }

    const [roles, permissions] = await Promise.all([
      this.accessControlRepository.findRoleNamesForUser(userId, organizationId),
      this.accessControlRepository.findPermissionNamesForUser(userId, organizationId),
    ]);

    const profile: AccessProfileView = {
      roles,
      permissions,
    };

    await this.accessProfileCache.set(userId, profile, organizationId);

    return profile;
  }

  async invalidateAccessProfile(userId: string): Promise<void> {
    await this.accessProfileCache.invalidateUser(userId);
  }

  async invalidateUsersForRole(roleId: string, executor?: TransactionExecutor): Promise<void> {
    const userIds = await this.accessControlRepository.findUserIdsForRole(roleId, executor);

    await this.accessProfileCache.invalidateUsers(userIds);
  }

  async invalidateUsersForPermission(
    permissionId: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    const userIds = await this.accessControlRepository.findUserIdsForPermission(
      permissionId,
      executor,
    );

    await this.accessProfileCache.invalidateUsers(userIds);
  }
}
