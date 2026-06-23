import type {
  DatabaseClient,
  DatabaseExecutor,
} from '@repo/api-database';

import { Inject, Injectable } from '@nestjs/common';
import { DATABASE } from '@repo/api-database';
import { invitations } from '@repo/api-database';
import { and, count, desc, eq } from 'drizzle-orm';

interface ListInvitationsParams {
  page: number;
  limit: number;
  email?: string;
  entityType?: string;
  entityId?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
}

@Injectable()
export class InvitationsRepository {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  async create(
    values: typeof invitations.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [invitation] = await executor
      .insert(invitations)
      .values(values)
      .returning();

    return invitation ?? null;
  }

  async findById(
    invitationId: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [invitation] = await executor
      .select()
      .from(invitations)
      .where(eq(invitations.id, invitationId))
      .limit(1);

    return invitation ?? null;
  }

  async findByTokenHash(
    tokenHash: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [invitation] = await executor
      .select()
      .from(invitations)
      .where(eq(invitations.tokenHash, tokenHash))
      .limit(1);

    return invitation ?? null;
  }

  async list(
    params: ListInvitationsParams,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters = [];

    if (params.email) {
      filters.push(eq(invitations.email, params.email));
    }

    if (params.entityType) {
      filters.push(eq(invitations.entityType, params.entityType));
    }

    if (params.entityId) {
      filters.push(eq(invitations.entityId, params.entityId));
    }

    if (params.status) {
      filters.push(eq(invitations.status, params.status));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(invitations)
        .where(whereClause)
        .orderBy(desc(invitations.createdAt))
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(invitations).where(whereClause),
    ]);

    return {
      rows,
      total: Number(totals[0]?.total ?? 0),
    };
  }

  async update(
    invitationId: string,
    values: Partial<typeof invitations.$inferInsert>,
    executor: DatabaseExecutor = this.database,
  ) {
    const [invitation] = await executor
      .update(invitations)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(invitations.id, invitationId))
      .returning();

    return invitation ?? null;
  }

  async acceptPending(
    invitationId: string,
    acceptedById: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const [invitation] = await executor
      .update(invitations)
      .set({
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        acceptedById,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(invitations.id, invitationId),
          eq(invitations.status, 'PENDING'),
        ),
      )
      .returning();

    return invitation ?? null;
  }

  async revokePendingForEntity(
    entityType: string,
    entityId: string,
    email: string,
    executor: DatabaseExecutor = this.database,
  ) {
    await executor
      .update(invitations)
      .set({
        status: 'REVOKED',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(invitations.entityType, entityType),
          eq(invitations.entityId, entityId),
          eq(invitations.email, email),
          eq(invitations.status, 'PENDING'),
        ),
      );
  }
}
