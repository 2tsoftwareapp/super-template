import type { TransactionExecutor } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";

import { OrganizationMembershipGateway } from "../../infrastructure/organization-membership.gateway";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "../ports/organizations.repository.port";

@Injectable()
export class AssertOrganizationMembershipUseCase {
  constructor(
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly membership: OrganizationMembershipGateway,
  ) {}

  async execute(organizationId: string, userId: string, executor?: TransactionExecutor) {
    const organization = await this.organizationsRepository.findById(organizationId, executor);

    if (!organization) {
      throw new AppError(
        ERROR_CODES.ORGANIZATION_NOT_FOUND,
        "Organization not found or has been deleted",
        HttpStatus.NOT_FOUND,
      );
    }

    const membership = await this.membership.findMembership(organizationId, userId, executor);

    if (!membership) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "You are not a member of this organization",
        HttpStatus.FORBIDDEN,
      );
    }

    return membership;
  }
}
