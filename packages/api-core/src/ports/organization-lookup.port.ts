import type { TransactionExecutor } from "../common/types/transaction-executor";

export type OrganizationMemberRole = "OWNER" | "ADMIN" | "MEMBER";

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

export const ORGANIZATION_LOOKUP = Symbol("ORGANIZATION_LOOKUP");
