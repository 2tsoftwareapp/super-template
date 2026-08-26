import type { DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { and, asc, eq, isNull } from "drizzle-orm";

import type { OrganizationsRepositoryPort } from "../application/ports/organizations.repository.port";

import {
  ORGANIZATION_CUSTOM_ROLES_PURGE,
  ORGANIZATION_USER_ROLES_PURGE,
  type OrganizationCustomRolesPurgePort,
  type OrganizationUserRolePurgePort,
} from "../public/contracts";
import { organizations } from "./persistence";

@Injectable()
export class OrganizationsRepository implements OrganizationsRepositoryPort {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(ORGANIZATION_USER_ROLES_PURGE)
    private readonly userRolesPurge: OrganizationUserRolePurgePort,
    @Inject(ORGANIZATION_CUSTOM_ROLES_PURGE)
    private readonly customRolesPurge: OrganizationCustomRolesPurgePort,
  ) {}

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
    await this.userRolesPurge.deleteByOrganizationId(organizationId, executor);
    await this.customRolesPurge.deleteByOrganizationId(organizationId, executor);
  }
}
