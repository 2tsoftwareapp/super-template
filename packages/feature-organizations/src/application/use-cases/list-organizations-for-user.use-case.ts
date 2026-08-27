import { Inject, Injectable } from "@nestjs/common";
import { type AuthenticatedRequestUser } from "@repo/api-runtime";

import type { OrganizationMembership } from "../../public/contracts";

import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

/** Platform super-role literal; importing access-control here would create a package cycle. */
const PLATFORM_SUPER_ADMIN = "SUPER_ADMIN";

@Injectable()
export class ListOrganizationsForUserUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
  ) {}

  async execute(user: AuthenticatedRequestUser, memberOnly = false) {
    if (user.roles.includes(PLATFORM_SUPER_ADMIN) && !memberOnly) {
      const allOrgs = await this.organizationsRepository.listAll();
      return allOrgs.map((org) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: "ADMIN" as const,
        createdAt: org.createdAt.toISOString(),
        updatedAt: org.updatedAt.toISOString(),
        current: org.id === user.organizationId,
      }));
    }

    const rows = await this.membership.listForUser(user.userId);
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      role: row.role,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      current: row.id === user.organizationId,
    }));
  }
}
