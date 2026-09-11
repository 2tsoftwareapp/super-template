import { Inject, Injectable } from "@nestjs/common";
import {
  type DatabaseClient,
  type DatabaseExecutor,
  getPrimaryDatabaseClient,
} from "@repo/database-runtime";
import { DATABASE } from "@repo/database-runtime";
import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";

import type {
  UsersCoreListQuery,
  UsersRepositoryPort,
} from "../application/ports/users.repository.port";
import type { UserLookup } from "../public/user-lookup.port";

import { users } from "./persistence";

const USER_SORT_FIELDS = {
  createdAt: users.createdAt,
  displayName: users.displayName,
  email: users.email,
  status: users.status,
} as const;

@Injectable()
export class UsersRepository implements UsersRepositoryPort, UserLookup {
  private readonly primaryDatabase: DatabaseClient;

  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {
    this.primaryDatabase = getPrimaryDatabaseClient(database);
  }

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

  async findByIdStrong(userId: string) {
    return this.findById(userId, this.primaryDatabase);
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

  async list(params: UsersCoreListQuery, executor: DatabaseExecutor = this.database) {
    const filters = [isNull(users.deletedAt)];

    if (params.search) {
      filters.push(
        sql`(${users.email} ilike ${`%${params.search}%`} or ${users.displayName} ilike ${`%${params.search}%`})`,
      );
    }

    if (params.status) {
      filters.push(eq(users.status, params.status));
    }

    if (params.candidateUserIds && params.candidateUserIds.length > 0) {
      filters.push(inArray(users.id, params.candidateUserIds));
    }

    const sortClauses = params.sort.map((criterion) => {
      const sortColumn = USER_SORT_FIELDS[criterion.field as keyof typeof USER_SORT_FIELDS];
      if (!sortColumn) {
        throw new Error(`Invalid sort field: ${criterion.field}`);
      }
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

  async filterExistingUserIds(
    userIds: string[],
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    if (userIds.length === 0) return [];
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.id, userIds), isNull(users.deletedAt)));
    return rows.map((r) => r.id);
  }

  async listDeliverableUserIds(executor: DatabaseExecutor = this.database): Promise<string[]> {
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.status, "ACTIVE"), isNull(users.deletedAt)));
    return rows.map((r) => r.id);
  }

  async findActiveUserInOrganization(
    userId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<{ id: string; email: string; displayName: string; status: string } | null> {
    const rows = await executor
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
      })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.status, "ACTIVE"),
          isNull(users.deletedAt),
          sql`exists(
            select 1 from r_organization_members
            where organization_id = ${organizationId}::uuid and user_id = ${users.id}
          )`,
        ),
      )
      .limit(1);
    return rows[0] ?? null;
  }

  async filterActiveUserIdsInOrganization(
    userIds: string[],
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    if (userIds.length === 0) return [];
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          inArray(users.id, userIds),
          eq(users.status, "ACTIVE"),
          isNull(users.deletedAt),
          sql`exists(
            select 1 from r_organization_members
            where organization_id = ${organizationId}::uuid and user_id = ${users.id}
          )`,
        ),
      );
    return rows.map((r) => r.id);
  }

  async listDeliverableUserIdsInOrganization(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.status, "ACTIVE"),
          isNull(users.deletedAt),
          sql`exists(
            select 1 from r_organization_members
            where organization_id = ${organizationId}::uuid and user_id = ${users.id}
          )`,
        ),
      );
    return rows.map((r) => r.id);
  }
}
