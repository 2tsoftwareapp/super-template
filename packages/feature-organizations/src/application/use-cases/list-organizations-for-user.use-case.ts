import { Inject, Injectable } from "@nestjs/common";
import { type AuthenticatedRequestUser, ROLE_NAMES } from "@repo/api-runtime";

import { ORGANIZATION_MEMBERSHIP, type OrganizationMembership } from "../../public/contracts";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

@Injectable()
export class ListOrganizationsForUserUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
  ) {}

  async execute(user: AuthenticatedRequestUser, memberOnly = false) {
    if (user.roles.includes(ROLE_NAMES.SUPER_ADMIN) && !memberOnly) {
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
