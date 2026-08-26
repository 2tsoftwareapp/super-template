import type { TransactionExecutor } from "@repo/api-runtime";

import { HttpStatus, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES } from "@repo/api-runtime";

import { OrganizationMembershipGateway } from "../../infrastructure/organization-membership.gateway";
import { AssertOrganizationMembershipUseCase } from "./assert-organization-membership.use-case";

@Injectable()
export class ResolveOrganizationIdForUserUseCase {
  constructor(
    private readonly membership: OrganizationMembershipGateway,
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
  ) {}

  async execute(userId: string, organizationId?: string | null, executor?: TransactionExecutor) {
    if (organizationId) {
      try {
        await this.assertOrganizationMembershipUseCase.execute(organizationId, userId, executor);
        return organizationId;
      } catch {
        // Fall back to primary organization if the specified one is invalid/deleted/non-member
      }
    }

    const primary = await this.membership.findPrimaryOrganizationId(userId, executor);

    if (!primary) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "No organization is available for this user",
        HttpStatus.FORBIDDEN,
      );
    }

    return primary;
  }
}
