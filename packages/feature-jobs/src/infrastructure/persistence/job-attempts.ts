import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { jobs } from "./jobs";

export const jobAttempts = pgTable(
  "w_job_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    // Denormalized (nullable, mirroring jobs.organization_id) so the tenant-isolation
    // RLS policy can apply directly to this table.
    organizationId: uuid("organization_id"),
    attemptNumber: integer("attempt_number").notNull(),
    status: text("status", {
      enum: ["PROCESSING", "COMPLETED", "FAILED"],
    }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    errorMessage: text("error_message"),
  },
  (table) => [
    uniqueIndex("job_attempts_job_id_attempt_number_unique").on(table.jobId, table.attemptNumber),
    index("job_attempts_job_id_idx").on(table.jobId),
    index("job_attempts_organization_id_idx").on(table.organizationId),
  ],
);
