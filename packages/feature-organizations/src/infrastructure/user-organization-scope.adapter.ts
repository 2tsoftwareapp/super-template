import type { TransactionExecutor } from "@repo/api-kernel";
import type { UserOrganizationScope } from "@repo/feature-users/contracts";

import { Inject, Injectable } from "@nestjs/common";

import type { OrganizationMembership } from "../public/organization-membership.port";

import { ORGANIZATION_MEMBERSHIP } from "../public/organization-membership.token";

/**
 * Implements the consumer-owned `USER_ORGANIZATION_SCOPE` port that
 * feature-users declares, so org-scoped user lookups no longer reach into
 * `r_organization_members` with raw SQL. The membership table stays private to
 * this feature; only the membership port is used, never the table directly.
 */
@Injectable()
export class UserOrganizationScopeAdapter implements UserOrganizationScope {
  constructor(
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
  ) {}

  async isMember(
    userId: string,
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<boolean> {
    const membership = await this.membership.findMembership(organizationId, userId, executor);
    return membership !== null;
  }

  async filterMemberUserIds(
    userIds: string[],
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<string[]> {
    if (userIds.length === 0) return [];

    const organizationMemberIds = await this.membership.findUserIdsForOrganization(
      organizationId,
      executor,
    );
    const candidates = new Set(userIds);

    return organizationMemberIds.filter((userId) => candidates.has(userId));
  }

  listMemberUserIds(organizationId: string, executor?: TransactionExecutor): Promise<string[]> {
    return this.membership.findUserIdsForOrganization(organizationId, executor);
  }
}
