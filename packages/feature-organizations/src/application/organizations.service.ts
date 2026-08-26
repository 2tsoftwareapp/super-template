import type { TransactionExecutor } from "@repo/api-runtime";

import { Injectable } from "@nestjs/common";

import { AssertOrganizationMembershipUseCase } from "./use-cases/assert-organization-membership.use-case";
import { EnsurePersonalOrganizationUseCase } from "./use-cases/ensure-personal-organization.use-case";
import { ResolveOrganizationIdForUserUseCase } from "./use-cases/resolve-organization-id-for-user.use-case";

/**
 * Cross-module facade for the organization operations other bounded contexts
 * (auth, sso, users, seed) depend on: personal-org provisioning, membership
 * assertion, and organization resolution. Self-service organization endpoints
 * inject the organization use cases directly instead of this facade.
 */
@Injectable()
export class OrganizationsService {
  constructor(
    private readonly ensurePersonalOrganizationUseCase: EnsurePersonalOrganizationUseCase,
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
    private readonly resolveOrganizationIdForUserUseCase: ResolveOrganizationIdForUserUseCase,
  ) {}

  async ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor?: TransactionExecutor,
  ) {
    return this.ensurePersonalOrganizationUseCase.execute(userId, displayName, executor);
  }

  async assertMembership(organizationId: string, userId: string, executor?: TransactionExecutor) {
    return this.assertOrganizationMembershipUseCase.execute(organizationId, userId, executor);
  }

  async resolveOrganizationIdForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ) {
    return this.resolveOrganizationIdForUserUseCase.execute(userId, organizationId, executor);
  }
}
