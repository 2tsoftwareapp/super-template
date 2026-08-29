import type { TransactionExecutor } from "@repo/api-runtime";

import { Injectable } from "@nestjs/common";

import type { PersonalOrganizationProvider } from "../public/personal-organization-provider.port";

import { EnsurePersonalOrganizationUseCase } from "../application/use-cases/ensure-personal-organization.use-case";

/**
 * Core personal-organization adapter — no access-control dependency.
 * When the orchestration layer (feature-organization-management) is present,
 * it overrides this with an RBAC-aware implementation through the
 * PERSONAL_ORGANIZATION_PROVIDER token.
 */
@Injectable()
export class CorePersonalOrganizationProvider implements PersonalOrganizationProvider {
  constructor(
    private readonly ensurePersonalOrganizationUseCase: EnsurePersonalOrganizationUseCase,
  ) {}

  ensurePersonalOrganization(
    userId: string,
    displayName: string,
    executor?: TransactionExecutor,
  ): Promise<unknown> {
    return this.ensurePersonalOrganizationUseCase.execute(userId, displayName, executor);
  }
}
