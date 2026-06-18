import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ERROR_CODES } from '@repo/api-core';
import { AppError } from '@repo/api-core';
import { DATABASE } from '@repo/api-database';
import { organizationMembers, roles, userRoles, users } from '@repo/api-database';
import { and, asc, count, desc, eq, inArray, isNull, sql } from 'drizzle-orm';

import type { UserSortCriterion } from '../application/user-sort';

interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'PENDING' | 'ACTIVE' | 'BLOCKED';
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
export class UsersRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof users.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [user] = await executor.insert(users).values(values).returning();

    if (!user) {
      throw new Error('User insert returned no rows');
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
        status: 'BLOCKED',
      },
      executor,
    );
  }

  async list(
    params: ListUsersParams,
    executor: DatabaseExecutor = this.database,
  ) {
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
      const roleUserIds = executor
        .select({
          userId: userRoles.userId,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(roles.name, params.role));

      filters.push(inArray(users.id, roleUserIds));
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
      return criterion.order === 'asc' ? asc(sortColumn) : desc(sortColumn);
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

  async assertEmailAvailable(
    email: string,
    executor: DatabaseExecutor = this.database,
    currentUserId?: string,
  ) {
    const existing = await this.findByEmail(email, executor);

    if (existing && existing.id !== currentUserId) {
      throw new AppError(
        ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
        'A user with this email already exists',
        HttpStatus.CONFLICT,
      );
    }
  }

  async listDeliverableUserIds(executor: DatabaseExecutor = this.database) {
    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(and(isNull(users.deletedAt), eq(users.status, 'ACTIVE')));

    return rows.map((row) => row.id);
  }

  async filterExistingUserIds(
    userIds: string[],
    executor: DatabaseExecutor = this.database,
  ) {
    if (userIds.length === 0) {
      return [];
    }

    const rows = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          inArray(users.id, userIds),
          isNull(users.deletedAt),
          eq(users.status, 'ACTIVE'),
        ),
      );

    return rows.map((row) => row.id);
  }
}
