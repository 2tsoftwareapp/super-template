import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, ROLE_NAMES } from "@repo/api-runtime";

import { OrganizationMembershipGateway } from "../../infrastructure/organization-membership.gateway";

@Injectable()
export class ListOrganizationMembersUseCase {
  constructor(private readonly membership: OrganizationMembershipGateway) {}

  async execute(organizationId: string, actor: string | AuthenticatedRequestUser) {
    const { userId: actorUserId, isSuperAdmin } =
      typeof actor === "string"
        ? { userId: actor, isSuperAdmin: false }
        : {
            userId: actor.userId,
            isSuperAdmin: actor.roles?.includes(ROLE_NAMES.SUPER_ADMIN) ?? false,
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
