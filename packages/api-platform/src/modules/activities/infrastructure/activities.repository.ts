import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { activities } from '@repo/api-database';
import { and, count, desc, eq } from 'drizzle-orm';

interface ListActivitiesParams {
  page: number;
  limit: number;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}

@Injectable()
export class ActivitiesRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof activities.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [activity] = await executor
      .insert(activities)
      .values(values)
      .returning();

    return activity ?? null;
  }

  async list(
    params: ListActivitiesParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = [];

    if (params.entityType) {
      filters.push(eq(activities.entityType, params.entityType));
    }

    if (params.entityId) {
      filters.push(eq(activities.entityId, params.entityId));
    }

    if (params.actorId) {
      filters.push(eq(activities.actorId, params.actorId));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(activities)
        .where(whereClause)
        .orderBy(desc(activities.createdAt))
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(activities).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }
}
