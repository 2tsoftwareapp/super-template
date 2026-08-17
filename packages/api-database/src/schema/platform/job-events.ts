import type { JsonObject } from "@repo/api-core";

import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { organizations } from "../identity/organizations";
import { jobAttempts } from "./job-attempts";
import { jobs } from "./jobs";

export const jobEvents = pgTable(
  "job_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    // Denormalized (nullable, mirroring jobs.organization_id) so the tenant-isolation
    // RLS policy can apply directly to this table.
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    attemptId: uuid("attempt_id").references(() => jobAttempts.id, {
      onDelete: "set null",
    }),
    type: text("type", {
      enum: ["claimed", "completed", "failed", "retry_scheduled", "cancelled", "no_handler"],
    }).notNull(),
    message: text("message"),
    // Pre-redacted before insert; never store raw secrets from job payloads here.
    metadata: jsonb("metadata").$type<JsonObject>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("job_events_job_id_idx").on(table.jobId),
    index("job_events_job_id_created_at_idx").on(table.jobId, table.createdAt),
    index("job_events_organization_id_idx").on(table.organizationId),
  ],
);
