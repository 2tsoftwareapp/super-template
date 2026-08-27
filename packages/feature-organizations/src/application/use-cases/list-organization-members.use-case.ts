import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {AppError, ERROR_CODES } from "@repo/api-runtime";

import { ORGANIZATION_MEMBERSHIP, type OrganizationMembership } from "../../public/contracts";

/** Platform super-role literal; importing access-control here would create a package cycle. */
const PLATFORM_SUPER_ADMIN = "SUPER_ADMIN";



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
            isSuperAdmin: actor.roles?.includes(PLATFORM_SUPER_ADMIN) ?? false,
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
