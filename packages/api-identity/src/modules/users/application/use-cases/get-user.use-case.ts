import {
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  AppError,
  type AuthenticatedRequestUser,
  ERROR_CODES,
  ROLE_NAMES,
} from '@repo/api-core';

import type { UserView } from '../users.types';

import { AccessControlService } from '../../../access-control/application/access-control.service';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../../../organizations/application/ports/organizations.repository.port';
import { assertUserBelongsToOrganization } from '../../domain/user-org-scope.policy';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../ports/users.repository.port';
import { UsersMapper } from '../users.mapper';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly usersMapper: UsersMapper,
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

    // SUPER_ADMIN sees all roles (no org filter). ORG_ADMIN only sees
    // roles scoped to their org (including platform-level roles).
    const organizationId = actor
      ? (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN) ? undefined : actor.organizationId ?? null)
      : null;

    const [accessProfile, roleIds, roleAssignments, userOrgs] = await Promise.all([
      this.accessControlService.getAccessProfile(
        userId,
        organizationId,
      ),
      this.accessControlService.getRoleIdsForUser(userId, organizationId),
      this.accessControlService.getRoleAssignmentsForUser(userId, organizationId),
      this.organizationsRepository.listForUser(userId),
    ]);

    return this.usersMapper.toUserView(
      user,
      accessProfile.roles,
      roleIds,
      roleAssignments,
      userOrgs.map((org) => org.id),
    );
  }
}
