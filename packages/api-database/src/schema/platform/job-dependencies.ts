import { index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { organizations } from "../identity/organizations";
import { jobs } from "./jobs";

export const jobDependencies = pgTable(
  "job_dependencies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    dependsOnJobId: uuid("depends_on_job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    // Denormalized from the dependent job's organization_id for the tenant-isolation RLS policy.
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("job_dependencies_job_id_depends_on_unique").on(table.jobId, table.dependsOnJobId),
    index("job_dependencies_job_id_idx").on(table.jobId),
    index("job_dependencies_depends_on_job_id_idx").on(table.dependsOnJobId),
    index("job_dependencies_organization_id_idx").on(table.organizationId),
  ],
);
