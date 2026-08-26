import type { AuthenticatedRequestUser } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, ROLE_NAMES } from "@repo/api-runtime";

import { OrganizationMembershipGateway } from "../../infrastructure/organization-membership.gateway";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

@Injectable()
export class GetOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly membership: OrganizationMembershipGateway,
  ) {}

  async execute(organizationId: string, actor: string | AuthenticatedRequestUser) {
    const { userId: actorUserId, isSuperAdmin } =
      typeof actor === "string"
        ? { userId: actor, isSuperAdmin: false }
        : {
            userId: actor.userId,
            isSuperAdmin: actor.roles?.includes(ROLE_NAMES.SUPER_ADMIN) ?? false,
          };

    let membership = null;
    if (!isSuperAdmin) {
      membership = await this.membership.findMembership(organizationId, actorUserId);

      if (!membership) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          "You are not a member of this organization",
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const organization = await this.organizationsRepository.findById(organizationId);

    if (!organization) {
      throw new AppError(
        ERROR_CODES.ORGANIZATION_NOT_FOUND,
        "Organization not found",
        HttpStatus.NOT_FOUND,
      );
    }

    const memberCount = await this.membership.countMembers(organizationId);

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      role: membership?.role ?? ("ADMIN" as const),
      memberCount,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }
}
