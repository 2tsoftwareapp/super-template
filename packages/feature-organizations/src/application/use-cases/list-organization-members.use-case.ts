import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import type { OrganizationMembership } from "../../public/contracts";

import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";

@Injectable()
export class ListOrganizationMembersUseCase {
  constructor(
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
  ) {}

  async execute(organizationId: string, actor: string | AuthenticatedRequestUser) {
    const { userId: actorUserId, isSuperAdmin } =
      typeof actor === "string"
        ? { userId: actor, isSuperAdmin: false }
        : {
            userId: actor.userId,
            isSuperAdmin: actor.roles?.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN) ?? false,
          };

    if (!isSuperAdmin) {
      const membership = await this.membership.findMembership(organizationId, actorUserId);

      if (!membership) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          "You are not a member of this organization",
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const members = await this.membership.listMembers(organizationId);

    return members.map((member) => ({
      userId: member.userId,
      email: member.email,
      displayName: member.displayName,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    }));
  }
}
