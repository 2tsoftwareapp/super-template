import type { DatabaseExecutor } from "@repo/api-database";

import { Inject, Injectable } from "@nestjs/common";
import { DATABASE, outboxMessages } from "@repo/api-database";
import { eq, sql } from "drizzle-orm";

import type {
  OutboxMessagePayload,
  OutboxRecord,
  OutboxRepositoryPort,
  OutboxTopic,
} from "../application/ports/outbox.repository.port";

@Injectable()
export class OutboxRepository implements OutboxRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseExecutor) {}

  async create(
    values: { topic: OutboxTopic; payload: OutboxMessagePayload },
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    await executor.insert(outboxMessages).values({
      topic: values.topic,
      payload: values.payload,
    });
  }

  async claimPending(limit: number): Promise<OutboxRecord[]> {
    const result = await this.database.execute<{
      id: string;
      topic: string;
      payload: OutboxMessagePayload;
      status: string;
      attempts: number;
      max_attempts: number;
    }>(sql`
      UPDATE outbox_messages
      SET
        status = 'PROCESSING',
        attempts = attempts + 1,
        updated_at = now()
      WHERE id IN (
        SELECT id
        FROM outbox_messages
        WHERE status = 'PENDING'
          AND scheduled_at <= now()
        ORDER BY created_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        topic,
        payload,
        status,
        attempts,
        max_attempts AS "max_attempts"
    `);

    return result.rows.map((row) => ({
      id: row.id,
      topic: row.topic as OutboxTopic,
      payload: row.payload,
      status: row.status,
      attempts: row.attempts,
      maxAttempts: row.max_attempts,
    }));
  }

  async markSent(id: string): Promise<void> {
    await this.database
      .update(outboxMessages)
      .set({
        status: "SENT",
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(outboxMessages.id, id));
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.database.execute(
      sql`
        UPDATE outbox_messages
        SET
          status = CASE
            WHEN attempts < max_attempts THEN 'PENDING'
            ELSE 'FAILED'
          END,
          error_message = ${errorMessage},
          scheduled_at = CASE
            WHEN attempts < max_attempts
              THEN now() + interval '1 minute' * power(2, attempts)
            ELSE scheduled_at
          END,
          processed_at = now(),
          updated_at = now()
        WHERE id = ${id}
      `,
    );
  }

  async recoverStaleProcessing(): Promise<void> {
    await this.database.execute(
      sql`
        UPDATE outbox_messages
        SET
          status = 'PENDING',
          updated_at = now()
        WHERE status = 'PROCESSING'
          AND updated_at < now() - interval '5 minutes'
      `,
    );
  }
}
