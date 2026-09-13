import type { TransactionExecutor } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, type OrganizationModelOptions } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { ORGANIZATION_MODEL_OPTIONS } from "@repo/database-runtime";

import type { OrganizationMembership } from "../../public/contracts";

import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";
import { AssertOrganizationMembershipUseCase } from "./assert-organization-membership.use-case";

@Injectable()
export class ResolveOrganizationIdForUserUseCase {
  constructor(
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
    @Inject(ORGANIZATION_MODEL_OPTIONS)
    private readonly organizationModelOptions: OrganizationModelOptions,
  ) {}

  async execute(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string | null> {
    if (organizationId) {
      try {
        await this.assertOrganizationMembershipUseCase.execute(organizationId, userId, executor);
        return organizationId;
      } catch {
        // Fall back to primary organization if the specified one is invalid/deleted/non-member
      }
    }

    const primary = await this.membership.findPrimaryOrganizationId(userId, executor);

    if (primary) {
      return primary;
    }

    if (this.organizationModelOptions.organizationModel === "org-optional") {
      // Organization-optional model: a user without any organization is a
      // valid platform user. Sessions run without a tenant scope.
      return null;
    }

    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "No organization is available for this user",
      HttpStatus.FORBIDDEN,
    );
  }
}
