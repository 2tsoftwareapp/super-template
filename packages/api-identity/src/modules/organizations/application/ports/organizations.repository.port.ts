import type { TransactionExecutor } from '@repo/api-core';

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMemberRecord {
  organizationId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMemberWithUserRecord {
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  email: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserOrganizationRecord {
  id: string;
  name: string;
  slug: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationsRepositoryPort {
  createOrganization(
    values: { name: string; slug: string },
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;

  addMember(
    values: { organizationId: string; userId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' },
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  upsertMember(
    values: { organizationId: string; userId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' },
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  findBySlug(
    slug: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;

  findById(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;

  findMembership(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  listForUser(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<UserOrganizationRecord[]>;

  listAll(
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord[]>;

  updateOrganization(
    organizationId: string,
    values: { name: string },
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;

  softDeleteOrganization(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationRecord | null>;

  listMembers(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberWithUserRecord[]>;

  countOwners(
    organizationId: string,
    options?: { excludingUserId?: string; executor?: TransactionExecutor; lock?: boolean },
  ): Promise<number>;

  countMembers(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<number>;

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER',
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  removeMember(
    organizationId: string,
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  findPrimaryOrganizationId(
    userId: string,
    executor?: TransactionExecutor,
  ): Promise<string | null>;

  deleteOrganizationMembershipsAndRoles(
    organizationId: string,
    executor?: TransactionExecutor,
  ): Promise<void>;
}

export const ORGANIZATIONS_REPOSITORY = Symbol('ORGANIZATIONS_REPOSITORY');
