import type { JsonObject } from "@repo/api-kernel";

import { organizations } from "@repo/feature-organizations/schema";
import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { mailDeliveryStatusEnum } from "./mail-enums";

export const mailDeliveries = pgTable(
  "t_mail_deliveries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // Tenant attribution for the delivery log. Nullable on purpose: the
    // platform-scope mail flows (auth verification/reset mail dispatched by the
    // outbox worker) run without a tenant context, and rows written before
    // migration 0041 also stay NULL. ON DELETE cascade mirrors the other
    // tenant-owned tables (`t_notifications`, `r_user_roles`) so a deleted
    // tenant's delivery log never degrades into an owner-less platform row.
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    templateKey: text("template_key").notNull(),
    recipient: text("recipient").notNull(),
    subject: text("subject").notNull(),
    status: mailDeliveryStatusEnum("status").notNull(),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").$type<JsonObject | null>(),
    sourceJobId: uuid("source_job_id"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    claimToken: text("claim_token"),
    providerMessageId: text("provider_message_id"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("mail_deliveries_job_recipient_uniq").on(table.sourceJobId, table.recipient),
    index("mail_deliveries_template_key_idx").on(table.templateKey),
    index("mail_deliveries_created_at_idx").on(table.createdAt),
    index("mail_deliveries_source_job_id_idx").on(table.sourceJobId),
    index("mail_deliveries_organization_id_idx").on(table.organizationId),
  ],
);
