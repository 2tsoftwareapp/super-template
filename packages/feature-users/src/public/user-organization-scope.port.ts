import type { TransactionExecutor } from "@repo/api-kernel";

/**
 * Consumer-owned port: organization membership rows live in the organizations
 * feature (`r_organization_members`), so `feature-users` must not read that
 * table itself. The port is declared here — by the consumer — and implemented
 * by `feature-organizations`, which binds it through its global module.
 *
 * The direction matters: organizations already depends on users (it joins the
 * users table for member listings), so users importing organizations would
 * close a dependency cycle. Declaring the port here keeps the two packages
 * decoupled while still removing the raw cross-feature SQL.
 */
export interface UserOrganizationScope {
  /** True when `userId` is a member of `organizationId`. */
  isMember(
    userId: string,
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<boolean>;

  /** Subset of `userIds` that are members of `organizationId`. */
  filterMemberUserIds(
    userIds: string[],
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  /** Every user id that is a member of `organizationId`. */
  listMemberUserIds(organizationId: string, executor?: TransactionExecutor): Promise<string[]>;
}

export const USER_ORGANIZATION_SCOPE = Symbol("USER_ORGANIZATION_SCOPE");
