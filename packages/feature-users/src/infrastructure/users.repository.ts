import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/database-runtime";
import { roles, userRoles } from "@repo/feature-access-control/schema";
import { organizationMembers } from "@repo/feature-organizations/schema";
import { and, asc, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import type { UsersRepositoryPort } from "../application/ports/users.repository.port";
import type { UserSortCriterion } from "../application/user-sort";

import { users } from "./persistence";

interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  status?: "PENDING" | "ACTIVE" | "BLOCKED";
  role?: string;
  organizationId?: string;
  sort: UserSortCriterion[];
}

const USER_SORT_FIELDS = {
  createdAt: users.createdAt,
  displayName: users.displayName,
  email: users.email,
  status: users.status,
} as const;

@Injectable()
export class UsersRepository implements UsersRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(values: typeof users.$inferInsert, executor: DatabaseExecutor = this.database) {
    const [user] = await executor.insert(users).values(values).returning();

    if (!user) {
      throw new Error("User insert returned no rows");
    }

    return user;
  }

  async findById(userId: string, executor: DatabaseExecutor = this.database) {
    const [user] = await executor
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }

  async findByEmail(email: string, executor: DatabaseExecutor = this.database) {
    const [user] = await executor
      .select()
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }

  async update(
    userId: string,
    values: Partial<typeof users.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [user] = await executor
      .update(users)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return user ?? null;
  }

  async softDelete(userId: string, executor: DatabaseExecutor = this.database) {
    return this.update(
      userId,
      {
        deletedAt: new Date(),
        status: "BLOCKED",
      },
      executor,
    );
  }

  async list(params: ListUsersParams, executor: DatabaseExecutor = this.database) {
    const filters = [isNull(users.deletedAt)];

    if (params.search) {
      filters.push(
        sql`(${users.email} ilike ${`%${params.search}%`} or ${users.displayName} ilike ${`%${params.search}%`})`,
      );
    }

    if (params.status) {
      filters.push(eq(users.status, params.status));
    }

    if (params.role) {
      const roleSubQuery = executor
        .select({
          userId: userRoles.userId,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id));

      const roleFilters: ReturnType<typeof isNull>[] = [eq(roles.name, params.role)];
      if (params.organizationId) {
        roleFilters.push(
          or(
            isNull(userRoles.organizationId),
            eq(userRoles.organizationId, params.organizationId),
          )!,
        );
      }

      roleSubQuery.where(and(...roleFilters));
      filters.push(inArray(users.id, roleSubQuery));
    }

    if (params.organizationId) {
      const organizationUserIds = executor
        .select({
          userId: organizationMembers.userId,
        })
        .from(organizationMembers)
        .where(eq(organizationMembers.organizationId, params.organizationId));

      filters.push(inArray(users.id, organizationUserIds));
    }

    const sortClauses = params.sort.map((criterion) => {
      const sortColumn = USER_SORT_FIELDS[criterion.field];
      return criterion.order === "asc" ? asc(sortColumn) : desc(sortColumn);
    });
    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;

    const [rows, totalRows] = await Promise.all([
      executor
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(...sortClauses)
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(users).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totalRows[0]?.total ?? 0),
    };
  }

  async isUserInOrganization(
    userId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [membership] = await executor
      .select({ userId: organizationMembers.userId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, userId),
          eq(organizationMembers.organizationId, organizationId),
        ),
      )
      .limit(1);

    return Boolean(membership);
  }

  async listDeliverableUserIds(executor: DatabaseExecutor = this.database) {
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(and(isNull(users.deletedAt), eq(users.status, "ACTIVE")));

    return rows.map((row) => row.id);
  }

  async filterExistingUserIds(userIds: string[], executor: DatabaseExecutor = this.database) {
    if (userIds.length === 0) {
      return [];
    }

    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.id, userIds), isNull(users.deletedAt), eq(users.status, "ACTIVE")));

    return rows.map((row) => row.id);
  }

  async findActiveUserInOrganization(
    userId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [row] = await executor
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
      })
      .from(users)
      .innerJoin(organizationMembers, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(users.id, userId),
          eq(organizationMembers.organizationId, organizationId),
          isNull(users.deletedAt),
          eq(users.status, "ACTIVE"),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async filterActiveUserIdsInOrganization(
    userIds: string[],
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    if (userIds.length === 0) {
      return [];
    }

    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .innerJoin(organizationMembers, eq(users.id, organizationMembers.userId))
      .where(
        and(
          inArray(users.id, userIds),
          eq(organizationMembers.organizationId, organizationId),
          isNull(users.deletedAt),
          eq(users.status, "ACTIVE"),
        ),
      );

    return rows.map((row) => row.id);
  }

  async listDeliverableUserIdsInOrganization(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .innerJoin(organizationMembers, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          isNull(users.deletedAt),
          eq(users.status, "ACTIVE"),
        ),
      );

    return rows.map((row) => row.id);
  }
}
