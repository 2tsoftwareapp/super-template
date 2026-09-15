import type { TransactionExecutor } from "@repo/api-kernel";

import type { OrganizationMemberRole } from "./organization-membership.port";

export interface OrganizationLookup {
  findPrimaryOrganizationId(userId: string, executor?: TransactionExecutor): Promise<string | null>;

  findById(organizationId: string, executor?: TransactionExecutor): Promise<{ id: string } | null>;

  findMembership(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<{ role: OrganizationMemberRole } | null>;

  upsertMember(
    values: {
      organizationId: string;
      userId: string;
      role: OrganizationMemberRole;
    },
    executor?: TransactionExecutor,
  ): Promise<{ role: OrganizationMemberRole } | null>;
}

export { ORGANIZATION_LOOKUP } from "./organization-lookup.token";
export type { OrganizationMemberRole } from "./organization-membership.port";
