import type { TransactionExecutor } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

import type { OrganizationMembership } from "../../public/contracts";

import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "organization";

/**
 * Core personal-organization creation — no access-control dependency.
 * When RBAC admin-role assignment is needed, the orchestration layer
 * (feature-organization-management) wraps this with access-control calls.
 */
@Injectable()
export class EnsurePersonalOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
  ) {}

  async execute(userId: string, displayName: string, executor?: TransactionExecutor) {
    const existing = await this.membership.findPrimaryOrganizationId(userId, executor);

    if (existing) {
      return existing;
    }

    const name = `${displayName.trim()}'s Organization`;
    const organization = await this.organizationsRepository.createOrganization(
      {
        name,
        slug: `${slugify(displayName)}-${userId.slice(0, 8)}`,
      },
      executor,
    );

    if (!organization) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        "Default organization could not be created",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    await this.membership.addMember(
      {
        organizationId: organization.id,
        userId,
        role: "OWNER",
      },
      executor,
    );

    return organization.id;
  }
}
