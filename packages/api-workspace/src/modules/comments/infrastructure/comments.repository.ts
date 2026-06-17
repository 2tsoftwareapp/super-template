import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { comments } from '@repo/api-database';
import { and, count, desc, eq, isNull } from 'drizzle-orm';

interface ListCommentsParams {
  page: number;
  limit: number;
  entityType: string;
  entityId: string;
}

@Injectable()
export class CommentsRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof comments.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [comment] = await executor
      .insert(comments)
      .values(values)
      .returning();

    return comment ?? null;
  }

  async findById(
    commentId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [comment] = await executor
      .select()
      .from(comments)
      .where(and(eq(comments.id, commentId), isNull(comments.deletedAt)))
      .limit(1);

    return comment ?? null;
  }

  async listByEntity(
    params: ListCommentsParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const whereClause = and(
      eq(comments.entityType, params.entityType),
      eq(comments.entityId, params.entityId),
      isNull(comments.deletedAt),
    );
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(comments)
        .where(whereClause)
        .orderBy(desc(comments.createdAt))
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(comments).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async update(
    commentId: string,
    values: Partial<typeof comments.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [comment] = await executor
      .update(comments)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(and(eq(comments.id, commentId), isNull(comments.deletedAt)))
      .returning();

    return comment ?? null;
  }

  async softDelete(
    commentId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [comment] = await executor
      .update(comments)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(comments.id, commentId), isNull(comments.deletedAt)))
      .returning();

    return comment ?? null;
  }
}
