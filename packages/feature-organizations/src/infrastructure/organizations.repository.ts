import type { DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, type DatabaseClient, getPrimaryDatabaseClient } from "@repo/database-runtime";
import { and, asc, eq, isNull } from "drizzle-orm";

import type { OrganizationsRepositoryPort } from "../application/ports/organizations.repository.port";

import { organizations } from "./persistence";

@Injectable()
export class OrganizationsRepository implements OrganizationsRepositoryPort {
  private readonly primaryDatabase: DatabaseClient;

  constructor(@Inject(DATABASE) database: DatabaseClient) {
    this.primaryDatabase = getPrimaryDatabaseClient(database);
  }

  async createOrganization(
    values: typeof organizations.$inferInsert,
    executor: DatabaseExecutor = this.primaryDatabase,
  ) {
    const [organization] = await executor.insert(organizations).values(values).returning();
    return organization ?? null;
  }

  async findBySlug(slug: string, executor: DatabaseExecutor = this.primaryDatabase) {
    const [organization] = await executor
      .select()
      .from(organizations)
      .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)))
      .limit(1);
    return organization ?? null;
  }

  async findById(organizationId: string, executor: DatabaseExecutor = this.primaryDatabase) {
    const [organization] = await executor
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .limit(1);
    return organization ?? null;
  }

  async listAll(executor: DatabaseExecutor = this.primaryDatabase) {
    return executor
      .select()
      .from(organizations)
      .where(isNull(organizations.deletedAt))
      .orderBy(asc(organizations.name));
  }

  async updateOrganization(
    organizationId: string,
    values: Partial<Pick<typeof organizations.$inferInsert, "name">>,
    executor: DatabaseExecutor = this.primaryDatabase,
  ) {
    const [organization] = await executor
      .update(organizations)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .returning();
    return organization ?? null;
  }

  async softDeleteOrganization(
    organizationId: string,
    executor: DatabaseExecutor = this.primaryDatabase,
  ) {
    const [organization] = await executor
      .update(organizations)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .returning();
    return organization ?? null;
  }
}
