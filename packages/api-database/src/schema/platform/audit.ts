import type { JsonObject } from "@repo/api-core";

import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { organizations } from "../identity/organizations";
import { users } from "../identity/users";

export const auditLogs = pgTable(
  "l_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<JsonObject | null>(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    requestId: text("request_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_id_idx").on(table.actorId),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_org_created_idx").on(table.organizationId, table.createdAt, table.id),
    index("audit_logs_org_action_created_idx").on(
      table.organizationId,
      table.action,
      table.createdAt,
    ),
    index("audit_logs_request_id_idx").on(table.requestId),
    index("audit_logs_created_at_id_idx").on(table.createdAt, table.id),
  ],
);
