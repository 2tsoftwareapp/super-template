import type { TransactionExecutor } from "@repo/api-kernel";

import { Injectable } from "@nestjs/common";

import { AssertOrganizationMembershipUseCase } from "./use-cases/assert-organization-membership.use-case";
import { ResolveOrganizationIdForUserUseCase } from "./use-cases/resolve-organization-id-for-user.use-case";

/**
 * Cross-module facade for the organization operations other bounded contexts
 * depend on: membership assertion and organization resolution.
 *
 * Personal-organization provisioning is NOT done through this facade.
 * Features that create users (auth, sso) must inject
 * PERSONAL_ORGANIZATION_PROVISIONER from feature-organization-management
 * to get RBAC-aware behavior.
 */
@Injectable()
export class OrganizationsService {
  constructor(
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
    private readonly resolveOrganizationIdForUserUseCase: ResolveOrganizationIdForUserUseCase,
  ) {}

  async assertMembership(organizationId: string, userId: string, executor?: TransactionExecutor) {
    return this.assertOrganizationMembershipUseCase.execute(organizationId, userId, executor);
  }

  async resolveOrganizationIdForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ): Promise<string | null> {
    return this.resolveOrganizationIdForUserUseCase.execute(userId, organizationId, executor);
  }
}
