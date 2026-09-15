import type { JsonObject } from "@repo/api-kernel";

import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { JOB_EVENT_TYPES } from "../../domain/job-event-type";
import { jobAttempts } from "./job-attempts";
import { jobs } from "./jobs";

export const jobEvents = pgTable(
  "w_job_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    // Denormalized (nullable, mirroring jobs.organization_id) so the tenant-isolation
    // RLS policy can apply directly to this table.
    organizationId: uuid("organization_id"),
    attemptId: uuid("attempt_id").references(() => jobAttempts.id, {
      onDelete: "set null",
    }),
    // Type-level vocabulary only: the column is plain `text` (migration 0013),
    // so adding a value here needs no migration. The list lives in
    // `domain/job-event-type.ts`, which is also what the repository union, the
    // application port and the API DTO enum read — see the DTO description for
    // what each value means.
    type: text("type", { enum: JOB_EVENT_TYPES }).notNull(),
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
