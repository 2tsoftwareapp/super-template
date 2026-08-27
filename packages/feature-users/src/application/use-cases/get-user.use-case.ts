import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {AppError, type AuthenticatedRequestUser } from "@repo/api-runtime";
import {
  AccessControlService,
  ROLE_NAMES,
} from "@repo/feature-access-control/contracts";
import {
  ORGANIZATION_MEMBERSHIP,
  type OrganizationMembership,
} from "@repo/feature-organizations/contracts";

import type { UserView } from "../users.types";

import { assertUserBelongsToOrganization } from "../../domain/user-org-scope.policy";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "../ports/users.repository.port";
import { UsersMapper } from "../users.mapper";

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
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
      await assertUserBelongsToOrganization(
        (targetUserId, organizationId) =>
          this.usersRepository.isUserInOrganization(targetUserId, organizationId),
        actor,
        userId,
      );
    }

    // SUPER_ADMIN sees all roles (no org filter). ORG_ADMIN only sees
    // roles scoped to their org (including platform-level roles).
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

import { USER_ERROR_CODES } from "@repo/feature-users/contracts";
