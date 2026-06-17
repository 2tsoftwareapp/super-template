import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import {
  organizationMembers,
  organizations,
} from '@repo/api-database';
import { and, asc, eq, isNull } from 'drizzle-orm';

@Injectable()
export class OrganizationsRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  get client(): DatabaseClient {
    return this.database;
  }

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
