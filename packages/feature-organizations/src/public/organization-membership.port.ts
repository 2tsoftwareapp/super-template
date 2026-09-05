import type { TransactionExecutor } from "@repo/api-kernel";

export type OrganizationMemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface OrganizationMemberRecord {
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMemberWithUserRecord {
  userId: string;
  role: OrganizationMemberRole;
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOrganizationRecord {
  id: string;
  name: string;
  slug: string;
  role: OrganizationMemberRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Consumer-owned port: membership rows live in feature-users storage,
 * so the port is defined here and bound by UsersModule. Other features
 * (organizations) consume it through this contract without importing
 * the users implementation.
 */
export interface OrganizationMembership {
  addMember(
    values: { organizationId: string; userId: string; role: OrganizationMemberRole },
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  upsertMember(
    values: { organizationId: string; userId: string; role: OrganizationMemberRole },
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  findMembership(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  listForUser(userId: string, executor?: TransactionExecutor): Promise<UserOrganizationRecord[]>;

  listMembers(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberWithUserRecord[]>;

  findUserIdsForOrganization(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<string[]>;

  countOwners(
    organizationId: string,
    options?: { excludingUserId?: string; executor?: TransactionExecutor; lock?: boolean },
  ): Promise<number>;

  countMembers(organizationId: string, executor?: TransactionExecutor): Promise<number>;

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationMemberRole,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  removeMember(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  findPrimaryOrganizationId(userId: string, executor?: TransactionExecutor): Promise<string | null>;

  deleteByOrganizationId(organizationId: string, executor?: TransactionExecutor): Promise<void>;
}
