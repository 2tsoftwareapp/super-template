import type { TransactionExecutor } from "../types/transaction-executor";
import type { OrganizationMemberRole } from "./organization-lookup.port";

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
 * Membership persistence for r_organization_members. Owned/implemented by
 * feature-users; feature-organizations consumes this port so it never imports
 * @repo/feature-users/schema (package DAG).
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

export const ORGANIZATION_MEMBERSHIP = Symbol("ORGANIZATION_MEMBERSHIP");
