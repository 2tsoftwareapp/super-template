import type { DatabaseExecutor } from '@repo/api-database';

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
    executor?: DatabaseExecutor,
  ): Promise<OrganizationRecord | null>;

  addMember(
    values: { organizationId: string; userId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' },
    executor?: DatabaseExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  upsertMember(
    values: { organizationId: string; userId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' },
    executor?: DatabaseExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  findBySlug(
    slug: string,
    executor?: DatabaseExecutor,
  ): Promise<OrganizationRecord | null>;

  findById(
    organizationId: string,
    executor?: DatabaseExecutor,
  ): Promise<OrganizationRecord | null>;

  findMembership(
    organizationId: string,
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  listForUser(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<UserOrganizationRecord[]>;

  updateOrganization(
    organizationId: string,
    values: { name: string },
    executor?: DatabaseExecutor,
  ): Promise<OrganizationRecord | null>;

  softDeleteOrganization(
    organizationId: string,
    executor?: DatabaseExecutor,
  ): Promise<OrganizationRecord | null>;

  listMembers(
    organizationId: string,
    executor?: DatabaseExecutor,
  ): Promise<OrganizationMemberWithUserRecord[]>;

  countOwners(
    organizationId: string,
    options?: { excludingUserId?: string; executor?: DatabaseExecutor },
  ): Promise<number>;

  countMembers(
    organizationId: string,
    executor?: DatabaseExecutor,
  ): Promise<number>;

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: 'OWNER' | 'ADMIN' | 'MEMBER',
    executor?: DatabaseExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  removeMember(
    organizationId: string,
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<OrganizationMemberRecord | null>;

  findPrimaryOrganizationId(
    userId: string,
    executor?: DatabaseExecutor,
  ): Promise<string | null>;
}

export const ORGANIZATIONS_REPOSITORY = Symbol('ORGANIZATIONS_REPOSITORY');
