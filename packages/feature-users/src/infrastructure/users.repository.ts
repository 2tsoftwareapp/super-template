import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/database-runtime";
import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";

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

    if (params.role || params.organizationId) {
      throw new Error("Role and organization filtering requires the user-management feature.");
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

  isUserInOrganization(
    userId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    void userId;
    void organizationId;
    void executor;
    return Promise.resolve(false);
  }

}
