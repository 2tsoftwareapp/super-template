import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const outboxMessages = pgTable(
  "w_outbox_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Tenant attribution of the published event, stamped from the producer's
    // tenant context when the row is appended. Nullable because producers that
    // run before a tenant exists (registration, seeds) publish platform-scope
    // events; rows written before migration 0042 also stay NULL.
    //
    // Kept as a bare uuid — like `w_jobs.organization_id` — so the outbox stays
    // a dependency leaf: a foreign key to `m_organizations` would force every
    // composition to enable the organizations feature. Isolation does not need
    // the constraint; the RLS policy in migration 0042 compares this column to
    // `app_tenant_id()`.
    organizationId: uuid("organization_id"),
    topic: text("topic").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("PENDING"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("outbox_messages_organization_id_idx").on(table.organizationId)],
);
