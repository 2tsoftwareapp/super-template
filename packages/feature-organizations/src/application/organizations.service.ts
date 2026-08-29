import type { TransactionExecutor } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";

import type { PersonalOrganizationProvider } from "../public/personal-organization-provider.port";

import { PERSONAL_ORGANIZATION_PROVIDER } from "../public/personal-organization-provider.token";
import { AssertOrganizationMembershipUseCase } from "./use-cases/assert-organization-membership.use-case";
import { ResolveOrganizationIdForUserUseCase } from "./use-cases/resolve-organization-id-for-user.use-case";

/**
 * Cross-module facade for the organization operations other bounded contexts
 * (auth, sso, users, seed) depend on: personal-org provisioning, membership
 * assertion, and organization resolution. Self-service organization endpoints
 * inject the organization use cases directly instead of this facade.
 *
 * Personal-organization provisioning is delegated through the
 * PERSONAL_ORGANIZATION_PROVIDER token so the orchestration layer
 * (feature-organization-management) can override it with RBAC-aware behavior.
 */
@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(PERSONAL_ORGANIZATION_PROVIDER)
    private readonly personalOrganizationProvider: PersonalOrganizationProvider,
    private readonly assertOrganizationMembershipUseCase: AssertOrganizationMembershipUseCase,
    private readonly resolveOrganizationIdForUserUseCase: ResolveOrganizationIdForUserUseCase,
  ) {}

  async ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor?: TransactionExecutor,
  ) {
    return this.personalOrganizationProvider.ensurePersonalOrganization(
      userId,
      displayName,
      executor,
    );
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
