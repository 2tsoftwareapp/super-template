import type { TransactionExecutor } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, type OrganizationModelOptions } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { ORGANIZATION_MODEL_OPTIONS } from "@repo/database-runtime";
import { ORGANIZATION_ERROR_CODES } from "@repo/feature-organizations/contracts";

import type { OrganizationMembership } from "../../public/contracts";

import { ORGANIZATION_MEMBERSHIP } from "../../public/organization-membership.token";
import { AssertOrganizationMembershipUseCase } from "./assert-organization-membership.use-case";

/** Rejections that mean "this tenant is not usable by this user". */
const ORG_FALLBACK_CODES = new Set<string>([
  ORGANIZATION_ERROR_CODES.ORGANIZATION_NOT_FOUND,
  ERROR_CODES.AUTH_FORBIDDEN,
]);

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
      } catch (error) {
        // Only a rejected membership/tenant may fall back to the primary org.
        // A DB error or timeout must surface: silently switching tenant would
        // run the rest of the request in the wrong organization.
        if (!(error instanceof AppError) || !ORG_FALLBACK_CODES.has(error.code)) {
          throw error;
        }
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
