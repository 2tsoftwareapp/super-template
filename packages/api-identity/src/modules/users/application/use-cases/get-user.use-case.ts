import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { UserView } from '../users.types';

import { AccessControlService } from '../../../access-control/application/access-control.service';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../../../organizations/application/ports/organizations.repository.port';
import { assertUserBelongsToOrganization } from '../../domain/user-org-scope.policy';
import { UsersMapper } from '../users.mapper';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../users.repository.port';

@Injectable()
export class GetUserUseCase {
  private readonly usersMapper = new UsersMapper();

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) {}

  async execute(
    userId: string,
    actor?: AuthenticatedRequestUser,
  ): Promise<UserView> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (actor) {
      await assertUserBelongsToOrganization(
        (targetUserId, organizationId) =>
          this.usersRepository.isUserInOrganization(
            targetUserId,
            organizationId,
          ),
        actor,
        userId,
      );
    }

    // The target's own primary organization, not the actor's — this is a
    // "view" operation and must show the target's real roles (including
    // org-scoped ones like ADMIN) regardless of who is asking.
    const primaryOrganizationId =
      await this.organizationsRepository.findPrimaryOrganizationId(userId);

    const [accessProfile, roleIds] = await Promise.all([
      this.accessControlService.getAccessProfile(
        userId,
        primaryOrganizationId,
      ),
      this.accessControlService.getRoleIdsForUser(userId),
    ]);

    return this.usersMapper.toUserView(user, accessProfile.roles, roleIds);
  }
}
