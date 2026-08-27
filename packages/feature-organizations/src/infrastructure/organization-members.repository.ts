import type { DatabaseExecutor } from "@repo/database-runtime";
import type {
  OrganizationMemberRecord,
  OrganizationMemberRole,
  OrganizationMembership,
} from "@repo/feature-organizations/contracts";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { users } from "@repo/feature-users/schema";
import { and, asc, count, eq, isNull, ne } from "drizzle-orm";

import { organizationMembers, organizations } from "./persistence";

@Injectable()
export class OrganizationMembersRepository implements OrganizationMembership {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async addMember(
    values: { organizationId: string; userId: string; role: OrganizationMemberRole },
    executor: DatabaseExecutor = this.database,
  ): Promise<OrganizationMemberRecord | null> {
    const [member] = await executor.insert(organizationMembers).values(values).returning();
    return member ?? null;
  }

  async upsertMember(
    values: { organizationId: string; userId: string; role: OrganizationMemberRole },
    executor: DatabaseExecutor = this.database,
  ): Promise<OrganizationMemberRecord | null> {
    const [member] = await executor
      .insert(organizationMembers)
      .values(values)
      .onConflictDoUpdate({
        target: [organizationMembers.organizationId, organizationMembers.userId],
        set: {
          role: values.role,
          updatedAt: new Date(),
        },
      })
      .returning();

    return member ?? null;
  }

  async findMembership(
    organizationId: string,
    userId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<OrganizationMemberRecord | null> {
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
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(and(eq(organizationMembers.userId, userId), isNull(organizations.deletedAt)))
      .orderBy(asc(organizations.name));
  }

  async listMembers(organizationId: string, executor: DatabaseExecutor = this.database) {
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
    options: { excludingUserId?: string; executor?: DatabaseExecutor; lock?: boolean } = {},
  ) {
    const executor = options.executor ?? this.database;
    if (options.lock) {
      const owners = await executor
        .select({ userId: organizationMembers.userId })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.role, "OWNER"),
          ),
        )
        .for("update");
      const filtered = options.excludingUserId
        ? owners.filter((o) => o.userId !== options.excludingUserId)
        : owners;
      return filtered.length;
    }
    const [result] = await executor
      .select({ value: count() })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.role, "OWNER"),
          options.excludingUserId
            ? ne(organizationMembers.userId, options.excludingUserId)
            : undefined,
        ),
      );
    return result?.value ?? 0;
  }

  async countMembers(organizationId: string, executor: DatabaseExecutor = this.database) {
    const [result] = await executor
      .select({ value: count() })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
    return result?.value ?? 0;
  }

  async findUserIdsForOrganization(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const rows = await executor
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
    return rows.map((row) => row.userId);
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: OrganizationMemberRole,
    executor: DatabaseExecutor = this.database,
  ): Promise<OrganizationMemberRecord | null> {
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
  ): Promise<OrganizationMemberRecord | null> {
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

  async findPrimaryOrganizationId(userId: string, executor: DatabaseExecutor = this.database) {
    const [member] = await executor
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(and(eq(organizationMembers.userId, userId), isNull(organizations.deletedAt)))
      .orderBy(asc(organizations.createdAt))
      .limit(1);

    return member?.organizationId ?? null;
  }

  async deleteByOrganizationId(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await executor
      .delete(organizationMembers)
      .where(eq(organizationMembers.organizationId, organizationId));
  }
}
