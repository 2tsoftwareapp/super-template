import type { UserView } from "@repo/feature-users/contracts";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, type AuthenticatedRequestUser } from "@repo/api-runtime";
import {
  ROLE_NAMES,
  USER_ACCESS_CONTROL,
  type UserAccessControl,
} from "@repo/feature-access-control/contracts";
import {
  ORGANIZATION_MEMBERSHIP,
  type OrganizationMembership,
} from "@repo/feature-organizations/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";
import { UsersMapper } from "@repo/feature-users/module";

import { assertUserBelongsToOrganization } from "../../user-org-scope.policy";

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(USER_ACCESS_CONTROL)
    private readonly accessControlService: UserAccessControl,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    private readonly usersMapper: UsersMapper,
  ) {}

  async execute(userId: string, actor?: AuthenticatedRequestUser): Promise<UserView> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(USER_ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    if (actor) {
      await assertUserBelongsToOrganization(this.membership, actor, userId);
    }

    const organizationId = actor
      ? actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)
        ? undefined
        : (actor.organizationId ?? null)
      : null;

    const [accessProfile, roleIds, roleAssignments, userOrgs] = await Promise.all([
      this.accessControlService.getAccessProfile(userId, organizationId),
      this.accessControlService.getRoleIdsForUser(userId, organizationId),
      this.accessControlService.getRoleAssignmentsForUser(userId, organizationId),
      this.membership.listForUser(userId),
    ]);

    const visibleMemberOrganizationIds =
      !actor || actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)
        ? userOrgs.map((org) => org.id)
        : actor.organizationId
          ? [actor.organizationId]
          : [];

    return this.usersMapper.toUserView(
      user,
      accessProfile.roles,
      roleIds,
      roleAssignments,
      visibleMemberOrganizationIds,
    );
  }
}
