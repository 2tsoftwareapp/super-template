import type { TransactionExecutor } from "@repo/api-kernel";

import { Inject, Injectable, Optional } from "@nestjs/common";
import { AccessProfileCache } from "@repo/api-runtime";
import { DATABASE, type DatabaseClient, getPrimaryDatabaseClient } from "@repo/database-runtime";

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
    @Optional() @Inject(DATABASE) database?: DatabaseClient,
  ) {
    this.primaryDatabase = database ? getPrimaryDatabaseClient(database) : undefined;
  }

  private readonly primaryDatabase: DatabaseClient | undefined;

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

  /**
   * Read permissions directly from primary storage and bypass the profile
   * cache. This is required when the result authorizes the current request.
   */
  async getAccessProfileStrong(
    userId: string,
    organizationId?: string | null,
  ): Promise<AccessProfileView> {
    if (!this.primaryDatabase) {
      throw new Error("Strong access-profile reads require the database runtime provider.");
    }
    const [roles, permissions] = await Promise.all([
      this.accessControlRepository.findRoleNamesForUser(
        userId,
        organizationId,
        this.primaryDatabase,
      ),
      this.accessControlRepository.findPermissionNamesForUser(
        userId,
        organizationId,
        this.primaryDatabase,
      ),
    ]);

    return { roles, permissions };
  }

  async invalidateAccessProfile(userId: string): Promise<void> {
    await this.accessProfileCache.invalidateUser(userId);
  }

  async invalidateAccessProfiles(userIds: string[]): Promise<void> {
    await this.accessProfileCache.invalidateUsers(userIds);
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
