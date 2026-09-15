import type { TransactionExecutor } from "@repo/api-kernel";

import { Injectable } from "@nestjs/common";
import { OrganizationsService } from "@repo/feature-organizations/module";

import type { AuthOrganizationContext } from "../public/auth-organization-context.port";

/**
 * Sole binding of auth's `AUTH_ORGANIZATION_CONTEXT` port: projects the
 * organizations service onto the auth-owned interface. This file is the only
 * place in auth that names `OrganizationsService`.
 */
@Injectable()
export class AuthOrganizationContextAdapter implements AuthOrganizationContext {
  constructor(private readonly organizationsService: OrganizationsService) {}

  resolveOrganizationIdForUser(
    userId: string,
    organizationId?: string | null,
    executor?: TransactionExecutor,
  ) {
    return this.organizationsService.resolveOrganizationIdForUser(userId, organizationId, executor);
  }

  async assertMembership(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<void> {
    await this.organizationsService.assertMembership(organizationId, userId, executor);
  }
}
