import type { DatabaseClient, DatabaseExecutor } from "@repo/database-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { getTenantContext } from "@repo/api-kernel";
import { DATABASE } from "@repo/database-runtime";
import { and, count, desc, eq, sql, type SQL } from "drizzle-orm";

import type {
  DeliveryRecord,
  MailDeliveriesRepositoryPort,
} from "../application/ports/mail-deliveries.repository.port";

import { mailDeliveries } from "./persistence";

interface ListDeliveriesParams {
  page: number;
  limit: number;
  templateKey?: string;
  status?: "PENDING" | "PROCESSING" | "PROVIDER_ACCEPTED" | "SENT" | "FAILED";
}

@Injectable()
export class MailDeliveriesRepository implements MailDeliveriesRepositoryPort {
  constructor(@Inject(DATABASE) private readonly database: DatabaseClient) {}

  /**
   * Organization of the active tenant context (HTTP request interceptor or job
   * handler). `null` means the caller runs in platform scope: auth mail
   * dispatched by the outbox worker, and jobs enqueued without an organization.
   * Reads and writes stay fenced either way because the table is under RLS.
   */
  private resolveTenantOrganizationId(): string | null {
    const tenantId = getTenantContext()?.tenantId ?? "";
    if (tenantId.length === 0) {
      return null;
    }
    return tenantId;
  }

  async create(
    values: typeof mailDeliveries.$inferInsert,
    executor: DatabaseExecutor = this.database,
  ) {
    const [delivery] = await executor
      .insert(mailDeliveries)
      .values({
        ...values,
        // Tenant attribution is mandatory on every write: an explicit value from
        // the caller wins, otherwise the ambient tenant context is stamped.
        organizationId:
          values.organizationId === undefined
            ? this.resolveTenantOrganizationId()
            : values.organizationId,
      })
      .onConflictDoNothing()
      .returning();

    return (delivery as DeliveryRecord) ?? null;
  }

  async findBySourceJobId(
    sourceJobId: string,
    recipient?: string,
    executor: DatabaseExecutor = this.database,
  ) {
    const filters: ReturnType<typeof eq>[] = [eq(mailDeliveries.sourceJobId, sourceJobId)];
    if (recipient) {
      filters.push(eq(mailDeliveries.recipient, recipient));
    }
    const [delivery] = await executor
      .select({
        id: mailDeliveries.id,
        status: mailDeliveries.status,
        recipient: mailDeliveries.recipient,
        errorMessage: mailDeliveries.errorMessage,
        createdAt: mailDeliveries.createdAt,
      })
      .from(mailDeliveries)
      .where(and(...filters))
      .limit(1);

    return delivery ?? null;
  }

  async claimForProcessing(
    deliveryId: string,
    leaseDurationMs = 300_000,
    executor: DatabaseExecutor = this.database,
  ) {
    const LEASE_DURATION_S = Math.ceil(leaseDurationMs / 1000);
    const token = crypto.randomUUID();
    const reclaimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE t_mail_deliveries
        SET
          status = 'PROCESSING',
          lease_expires_at = now() + (${LEASE_DURATION_S} || ' seconds')::interval,
          claim_token = ${token},
          updated_at = now()
        WHERE id IN (
          SELECT id FROM t_mail_deliveries
          WHERE id = ${deliveryId}
            AND status = 'PENDING'
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `,
    );

    if (!reclaimed.rows?.[0]) {
      return null;
    }

    const [delivery] = await executor
      .select()
      .from(mailDeliveries)
      .where(eq(mailDeliveries.id, reclaimed.rows[0].id))
      .limit(1);

    return (delivery as DeliveryRecord) ?? null;
  }

  async reclaimForRetry(
    sourceJobId: string,
    recipient: string,
    executor: DatabaseExecutor = this.database,
  ) {
    // Reclaim only a FAILED delivery or a stale PROCESSING row (lease expired)
    // back to PENDING. Terminal statuses (SENT, PROVIDER_ACCEPTED) must stay
    // final. Matches by the composite unique key (sourceJobId + recipient) to
    // handle multi-recipient source jobs correctly. FOR UPDATE SKIP LOCKED
    // keeps concurrent workers from double-claiming the same row.
    const reclaimed = await executor.execute<{ id: string }>(
      sql`
        UPDATE t_mail_deliveries
        SET
          status = 'PENDING',
          error_message = NULL,
          sent_at = NULL,
          lease_expires_at = NULL,
          claim_token = NULL,
          updated_at = now()
        WHERE id IN (
          SELECT id FROM t_mail_deliveries
          WHERE source_job_id = ${sourceJobId}
            AND recipient = ${recipient}
            AND (
              status = 'FAILED'
              OR (status = 'PROCESSING' AND lease_expires_at IS NOT NULL AND lease_expires_at < now())
            )
            AND status NOT IN ('SENT', 'PROVIDER_ACCEPTED')
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING id
      `,
    );

    if (!reclaimed.rows?.[0]) {
      return null;
    }

    const [delivery] = await executor
      .select()
      .from(mailDeliveries)
      .where(eq(mailDeliveries.id, reclaimed.rows[0].id))
      .limit(1);

    return (delivery as DeliveryRecord) ?? null;
  }

  async updateStatus(
    id: string,
    claimToken: string,
    values: {
      status: "SENT" | "FAILED";
      errorMessage?: string | null;
      sentAt?: Date | null;
      providerMessageId?: string | null;
    },
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    // Use raw SQL with RETURNING to atomically fence: only update when
    // id + claimToken + status = PROCESSING all match (stale-worker guard).
    const updated = await executor.execute<{ id: string }>(
      sql`
        UPDATE t_mail_deliveries
        SET
          status = ${values.status}::mail_delivery_status,
          error_message = ${values.errorMessage ?? null},
          sent_at = ${values.sentAt ?? null},
          provider_message_id = ${values.providerMessageId ?? null},
          lease_expires_at = NULL,
          claim_token = NULL,
          updated_at = now()
        WHERE id = ${id}
          AND claim_token = ${claimToken}
          AND status = 'PROCESSING'
        RETURNING id
      `,
    );
    if (!updated.rows?.[0]) {
      const [current] = await executor
        .select({ id: mailDeliveries.id, status: mailDeliveries.status })
        .from(mailDeliveries)
        .where(eq(mailDeliveries.id, id))
        .limit(1);
      if (current) {
        throw new Error(
          `Stale worker update blocked: delivery ${id} is now ${current.status} (claim token mismatch or already finalised)`,
        );
      }
    }
  }

  async markProviderAccepted(
    deliveryId: string,
    providerMessageId?: string,
    executor: DatabaseExecutor = this.database,
  ): Promise<void> {
    // Unfenced raw-SQL escape hatch: sets PROVIDER_ACCEPTED without requiring
    // a matching claim_token. Used when the fenced updateStatus(SENT) fails
    // after the external provider has already accepted the email.
    await executor.execute(
      sql`
        UPDATE t_mail_deliveries
        SET
          status = 'PROVIDER_ACCEPTED',
          provider_message_id = ${providerMessageId ?? null},
          lease_expires_at = NULL,
          claim_token = NULL,
          updated_at = now()
        WHERE id = ${deliveryId}
      `,
    );
  }

  async list(params: ListDeliveriesParams, executor: DatabaseExecutor = this.database) {
    const organizationId = this.resolveTenantOrganizationId();
    const filters: SQL[] = [
      // list() is the tenant-facing delivery log (GET /admin/mail/deliveries).
      // It is scoped to the caller's organization and never exposes
      // platform-scope rows (`organization_id IS NULL`, auth mail written by the
      // outbox worker). Without a tenant context the filter matches nothing, so
      // the read fails closed instead of leaking every tenant's deliveries.
      // RLS fences the same rows at the database level.
      organizationId === null ? sql`false` : eq(mailDeliveries.organizationId, organizationId),
    ];

    if (params.templateKey) {
      filters.push(eq(mailDeliveries.templateKey, params.templateKey));
    }

    if (params.status) {
      filters.push(eq(mailDeliveries.status, params.status));
    }

    const whereClause = and(...filters);
    const offset = (params.page - 1) * params.limit;

    const [rows, totals] = await Promise.all([
      executor
        .select()
        .from(mailDeliveries)
        .where(whereClause)
        .orderBy(desc(mailDeliveries.createdAt))
        .limit(params.limit)
        .offset(offset),
      executor.select({ total: count() }).from(mailDeliveries).where(whereClause),
    ]);

    return {
      rows: rows as DeliveryRecord[],
      total: Number(totals[0]?.total ?? 0),
    };
  }
}
