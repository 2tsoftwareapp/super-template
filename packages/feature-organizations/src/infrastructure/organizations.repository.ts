import type { UserRoleAssignments } from "@repo/api-runtime";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { resolveLazyPort, USER_ROLE_ASSIGNMENTS } from "@repo/api-runtime";
import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { roles } from "@repo/feature-access-control/schema";
import { and, asc, eq, isNull } from "drizzle-orm";

import type { OrganizationsRepositoryPort } from "../application/ports/organizations.repository.port";

import { organizations } from "./persistence";

@Injectable()
export class OrganizationsRepository implements OrganizationsRepositoryPort {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
  ) {}

  private userRoleAssignments(): UserRoleAssignments {
    return resolveLazyPort<UserRoleAssignments>(USER_ROLE_ASSIGNMENTS);
  }

  async createOrganization(
    values: typeof organizations.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [organization] = await executor.insert(organizations).values(values).returning();
    return organization ?? null;
  }

  async findBySlug(slug: string, executor: DatabaseExecutor = this.database) {
    const [organization] = await executor
      .select()
      .from(organizations)
      .where(and(eq(organizations.slug, slug), isNull(organizations.deletedAt)))
      .limit(1);
    return organization ?? null;
  }

  async findById(organizationId: string, executor: DatabaseExecutor = this.database) {
    const [organization] = await executor
      .select()
      .from(organizations)
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .limit(1);
    return organization ?? null;
  }

  async listAll(executor: DatabaseExecutor = this.database) {
    return executor
      .select()
      .from(organizations)
      .where(isNull(organizations.deletedAt))
      .orderBy(asc(organizations.name));
  }

  async updateOrganization(
    organizationId: string,
    values: Partial<Pick<typeof organizations.$inferInsert, "name">>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [organization] = await executor
      .update(organizations)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .returning();
    return organization ?? null;
  }

  async softDeleteOrganization(organizationId: string, executor: DatabaseExecutor = this.database) {
    const [organization] = await executor
      .update(organizations)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(organizations.id, organizationId), isNull(organizations.deletedAt)))
      .returning();
    return organization ?? null;
  }

  async deleteOrganizationRoles(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await this.userRoleAssignments().deleteByOrganizationId(organizationId, executor);
    await executor.delete(roles).where(eq(roles.organizationId, organizationId));
  }
}
