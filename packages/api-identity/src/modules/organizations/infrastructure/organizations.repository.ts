import type { DatabaseExecutor } from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE, type DatabaseClient } from '@repo/api-database';
import {
  organizationMembers,
  organizations,
  users,
} from '@repo/api-database';
import { and, asc, count, eq, isNull, ne } from 'drizzle-orm';

import type { OrganizationsRepositoryPort } from '../application/ports/organizations.repository.port';

export type OrganizationMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

@Injectable()
export class OrganizationsRepository implements OrganizationsRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async createOrganization(
    values: typeof organizations.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [organization] = await executor
      .insert(organizations)
      .values(values)
      .returning();
    return organization ?? null;
  }

  async addMember(
    values: typeof organizationMembers.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [member] = await executor
      .insert(organizationMembers)
      .values(values)
      .returning();
    return member ?? null;
  }

  async upsertMember(
    values: typeof organizationMembers.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [member] = await executor
      .insert(organizationMembers)
      .values(values)
      .onConflictDoUpdate({
        target: [
          organizationMembers.organizationId,
          organizationMembers.userId,
        ],
        set: {
          role: values.role,
          updatedAt: new Date(),
        },
      })
      .returning();

    return member ?? null;
  }

  async findBySlug(
    slug: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [organization] = await executor
      .select()
      .from(organizations)
      .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)))
      .limit(1);
    return organization ?? null;
  }

  async findById(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [organization] = await executor
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, organizationId),
          isNull(organizations.deletedAt),
        ),
      )
      .limit(1);
    return organization ?? null;
  }

  async findMembership(
    organizationId: string,
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [member] = await executor
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId),
        ),
      )
      .limit(1);
    return member ?? null;
  }

  async listForUser(userId: string, executor: DatabaseExecutor = this.database) {
    return executor
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        role: organizationMembers.role,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizationMembers)
      .innerJoin(
        organizations,
        eq(organizationMembers.organizationId, organizations.id),
      )
      .where(
        and(
          eq(organizationMembers.userId, userId),
          isNull(organizations.deletedAt),
        ),
      )
      .orderBy(asc(organizations.name));
  }

  async updateOrganization(
    organizationId: string,
    values: Partial<Pick<typeof organizations.$inferInsert, 'name'>>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [organization] = await executor
      .update(organizations)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(organizations.id, organizationId),
          isNull(organizations.deletedAt),
        ),
      )
      .returning();
    return organization ?? null;
  }

  async softDeleteOrganization(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [organization] = await executor
      .update(organizations)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(organizations.id, organizationId),
          isNull(organizations.deletedAt),
        ),
      )
      .returning();
    return organization ?? null;
  }

  async listMembers(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    return executor
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        email: users.email,
        displayName: users.displayName,
        createdAt: organizationMembers.createdAt,
        updatedAt: organizationMembers.updatedAt,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.organizationId, organizationId))
      .orderBy(asc(organizationMembers.createdAt));
  }

  async countOwners(
    organizationId: string,
    options: { excludingUserId?: string; executor?: DatabaseExecutor } = {},
  ) {
    const executor = options.executor ?? this.database;
    const [result] = await executor
      .select({ value: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, 'OWNER'),
          options.excludingUserId
            ? ne(organizationMembers.userId, options.excludingUserId)
            : undefined,
        ),
      );
    return result?.value ?? 0;
  }

  async countMembers(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [result] = await executor
      .select({ value: count() })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
    return result?.value ?? 0;
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationMemberRole,
    executor: DatabaseExecutor = this.database,
  ) {
    const [member] = await executor
      .update(organizationMembers)
      .set({ role, updatedAt: new Date() })
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId),
        ),
      )
      .returning();
    return member ?? null;
  }

  async removeMember(
    organizationId: string,
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [member] = await executor
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId),
        ),
      )
      .returning();
    return member ?? null;
  }

  async findPrimaryOrganizationId(
    userId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [member] = await executor
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .innerJoin(
        organizations,
        eq(organizationMembers.organizationId, organizations.id),
      )
      .where(
        and(
          eq(organizationMembers.userId, userId),
          isNull(organizations.deletedAt),
        ),
      )
      .orderBy(asc(organizations.createdAt))
      .limit(1);

    return member?.organizationId ?? null;
  }
}
