import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/database-runtime";
import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import type { UsersRepositoryPort } from "../application/ports/users.repository.port";
import type { UserSortCriterion } from "../application/user-sort";
import type { OrganizationMembership } from "../public/organization-membership.port";
import { ORGANIZATION_MEMBERSHIP } from "../public/organization-membership.token";
import type { UserRoleAssignments } from "../public/user-role-assignments.port";
import { USER_ROLE_ASSIGNMENTS } from "../public/user-role-assignments.token";

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
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USER_ROLE_ASSIGNMENTS)
    private readonly userRoleAssignments: UserRoleAssignments,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly organizationMembership: OrganizationMembership,
  ) {}

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
      const roleUserIds = await this.userRoleAssignments.findUserIdsForRoleName(
        params.role,
        params.organizationId,
        executor,
      );
      if (roleUserIds.length === 0) {
        return { rows: [], total: 0 };
      }
      filters.push(inArray(users.id, roleUserIds));
    }

    if (params.organizationId) {
      const organizationUserIds = await this.organizationMembership.findUserIdsForOrganization(
        params.organizationId,
        executor,
      );
      if (organizationUserIds.length === 0) {
        return { rows: [], total: 0 };
      }
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
    const memberIds = await this.organizationMembership.findUserIdsForOrganization(
      organizationId,
      executor,
    );
    return memberIds.includes(userId);
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
    const memberIds = await this.organizationMembership.findUserIdsForOrganization(
      organizationId,
      executor,
    );
    if (!memberIds.includes(userId)) {
      return null;
    }
    const [row] = await executor
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
      })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt), eq(users.status, "ACTIVE")))
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

    const memberIds = await this.organizationMembership.findUserIdsForOrganization(
      organizationId,
      executor,
    );
    if (memberIds.length === 0) {
      return [];
    }
    const memberSet = new Set(memberIds);
    const candidates = userIds.filter((id) => memberSet.has(id));
    if (candidates.length === 0) {
      return [];
    }
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(inArray(users.id, candidates), isNull(users.deletedAt), eq(users.status, "ACTIVE")),
      );
    return rows.map((row) => row.id);
  }

  async listDeliverableUserIdsInOrganization(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const memberIds = await this.organizationMembership.findUserIdsForOrganization(
      organizationId,
      executor,
    );
    if (memberIds.length === 0) {
      return [];
    }
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(inArray(users.id, memberIds), isNull(users.deletedAt), eq(users.status, "ACTIVE")),
      );
    return rows.map((row) => row.id);
  }
}
