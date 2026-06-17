import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { mailDeliveries } from '@repo/api-database';
import { and, count, desc, eq } from 'drizzle-orm';

interface ListDeliveriesParams {
  page: number;
  limit: number;
  templateKey?: string;
  status?: 'SENT' | 'FAILED';
}

@Injectable()
export class MailDeliveriesRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof mailDeliveries.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .insert(mailDeliveries)
      .values(values)
      .returning();

    return delivery ?? null;
  }

  async list(
    params: ListDeliveriesParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = [];

    if (params.templateKey) {
      filters.push(eq(mailDeliveries.templateKey, params.templateKey));
    }

    if (params.status) {
      filters.push(eq(mailDeliveries.status, params.status));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(mailDeliveries)
        .where(whereClause)
        .orderBy(desc(mailDeliveries.createdAt))
        .limit(params.limit)
        .offset(offset),
      executor
        .select({ total: count() })
        .from(mailDeliveries)
        .where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }
}
