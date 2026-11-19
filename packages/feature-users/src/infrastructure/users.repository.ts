import { Inject, Injectable, Optional } from "@nestjs/common";
import { AppError } from "@repo/api-kernel";
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

import {
  softDeleteUserAccount,
  USER_ACCOUNT_SOFT_DELETE_MARKER,
  USER_ACCOUNT_STATUS,
} from "../domain/user-account.policy";
import { USER_ERROR_CODES } from "../public/error-codes";
import {
  USER_ORGANIZATION_SCOPE,
  type UserOrganizationScope,
} from "../public/user-organization-scope.port";
import { users } from "./persistence";

/**
 * SQL rendering of `isActiveUserAccount`: live accounts are the ones whose
 * soft-delete marker is unset (`domain/user-account.policy.ts`).
 */
const activeAccount = () => isNull(users[USER_ACCOUNT_SOFT_DELETE_MARKER]);

const USER_SORT_FIELDS = {
  createdAt: users.createdAt,
  displayName: users.displayName,
  email: users.email,
  status: users.status,
} as const;

@Injectable()
export class UsersRepository implements UsersRepositoryPort, UserLookup {
  private readonly primaryDatabase: DatabaseClient;

  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    // Optional so the users graph still boots when the organizations feature is
    // not composed (see the omit-feature bootstrap matrix). Org-scoped lookups
    // then fail closed instead of silently answering.
    @Optional()
    @Inject(USER_ORGANIZATION_SCOPE)
    private readonly organizationScope?: UserOrganizationScope,
  ) {
    this.primaryDatabase = getPrimaryDatabaseClient(database);
  }

  /**
   * Membership reads are owned by feature-organizations and reached through
   * {@link UserOrganizationScope}. Without the binding we cannot answer an
   * organization-scoped question at all, so refuse loudly rather than return an
   * empty result that callers would read as "no members".
   */
  private requireOrganizationScope(): UserOrganizationScope {
    if (!this.organizationScope) {
      throw new AppError(
        USER_ERROR_CODES.USER_ORGANIZATION_SCOPE_UNAVAILABLE,
        "Organization-scoped user lookups require the USER_ORGANIZATION_SCOPE port",
        500,
      );
    }

    return this.organizationScope;
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
      .where(and(eq(users.id, userId), activeAccount()))
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
      .where(and(eq(users.email, email), activeAccount()))
      .limit(1);

    return user ?? null;
  }

  async findByEmailStrong(email: string) {
    return this.findByEmail(email, this.primaryDatabase);
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
    return this.update(userId, softDeleteUserAccount(new Date()), executor);
  }

  async list(params: UsersCoreListQuery, executor: DatabaseExecutor = this.database) {
    const filters = [activeAccount()];

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
      .where(and(inArray(users.id, userIds), activeAccount()));
    return rows.map((r) => r.id);
  }

  async listDeliverableUserIds(executor: DatabaseExecutor = this.database): Promise<string[]> {
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.status, USER_ACCOUNT_STATUS.ACTIVE), activeAccount()));
    return rows.map((r) => r.id);
  }

  async findActiveUserInOrganization(
    userId: string,
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<{ id: string; email: string; displayName: string; status: string } | null> {
    const isMember = await this.requireOrganizationScope().isMember(
      userId,
      organizationId,
      executor,
    );

    if (!isMember) {
      return null;
    }

    const rows = await executor
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
      })
      .from(users)
      .where(
        and(eq(users.id, userId), eq(users.status, USER_ACCOUNT_STATUS.ACTIVE), activeAccount()),
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

    const memberIds = await this.requireOrganizationScope().filterMemberUserIds(
      userIds,
      organizationId,
      executor,
    );

    if (memberIds.length === 0) return [];

    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          inArray(users.id, memberIds),
          eq(users.status, USER_ACCOUNT_STATUS.ACTIVE),
          activeAccount(),
        ),
      );

    return rows.map((r) => r.id);
  }

  async listDeliverableUserIdsInOrganization(
    organizationId: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<string[]> {
    const memberIds = await this.requireOrganizationScope().listMemberUserIds(
      organizationId,
      executor,
    );

    if (memberIds.length === 0) return [];

    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          inArray(users.id, memberIds),
          eq(users.status, USER_ACCOUNT_STATUS.ACTIVE),
          activeAccount(),
        ),
      );

    return rows.map((r) => r.id);
  }
}
