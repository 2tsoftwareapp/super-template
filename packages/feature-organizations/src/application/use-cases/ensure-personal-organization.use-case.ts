import type { TransactionExecutor } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";

import { ORGANIZATION_MEMBERSHIP, type OrganizationMembership } from "../../public/contracts";
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

import {
  ORGANIZATION_ACCESS_CONTROL,
  type OrganizationAccessControlPort,
} from "../../public/contracts";

@Injectable()
export class EnsurePersonalOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(ORGANIZATION_ACCESS_CONTROL)
    private readonly accessControl: OrganizationAccessControlPort,
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
    await this.accessControl.ensureOrganizationAdminRole(organization.id, userId, executor);

    return organization.id;
  }
}
