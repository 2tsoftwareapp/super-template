import type { JsonObject } from "@repo/api-kernel";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { getTenantContext } from "@repo/api-kernel";
import { DATABASE } from "@repo/database-runtime";
import { eq, sql } from "drizzle-orm";

import type { OutboxRecord, OutboxRepositoryPort } from "../public/outbox.port";

import { outboxMessages } from "./persistence/outbox-messages";

/**
 * Organization of the active tenant context, or `null` when the producer runs
 * without one (registration, seeds). An empty tenant id means "no tenant" and is
 * stored as NULL so the policy's platform-scope branch applies.
 */
function currentOrganizationId(): string | null {
  const tenantId = getTenantContext()?.tenantId ?? "";
  if (tenantId.length === 0) {
    return null;
  }
  return tenantId;
}

@Injectable()
export class OutboxRepository implements OutboxRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseExecutor) {}

  /**
   * Append stamps the producer's tenant context onto the event. Producers write
   * in the same transaction as their state change, so the ambient context (HTTP
   * interceptor or job handler) is the publishing tenant. Producers that run
   * before a tenant exists (registration, seeds) publish platform-scope events
   * with a `null` organization.
   */
  async append(topic: string, payload: JsonObject, executor?: DatabaseExecutor): Promise<void> {
    const client = executor ?? this.database;
    await client.insert(outboxMessages).values({
      topic,
      payload,
      organizationId: currentOrganizationId(),
    });
  }

  async claimPending(limit: number): Promise<OutboxRecord[]> {
    const result = await this.database.execute<{
      id: string;
      organization_id: string | null;
      topic: string;
      payload: JsonObject;
      status: string;
      attempts: number;
      max_attempts: number;
    }>(sql`
      UPDATE w_outbox_messages
      SET
        status = 'PROCESSING',
        attempts = attempts + 1,
        updated_at = now()
      WHERE id IN (
        SELECT id
        FROM w_outbox_messages
        WHERE status = 'PENDING'
          AND scheduled_at <= now()
        ORDER BY created_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        organization_id,
        topic,
        payload,
        status,
        attempts,
        max_attempts AS "max_attempts"
    `);

    return result.rows.map((row) => ({
      id: row.id,
      organizationId: row.organization_id ?? null,
      topic: row.topic,
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
        UPDATE w_outbox_messages
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
        UPDATE w_outbox_messages
        SET
          status = 'PENDING',
          updated_at = now()
        WHERE status = 'PROCESSING'
          AND updated_at < now() - interval '5 minutes'
      `,
    );
  }
}
