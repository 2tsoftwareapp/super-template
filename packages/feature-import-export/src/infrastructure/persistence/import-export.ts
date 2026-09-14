import type { JsonObject } from "@repo/api-kernel";

import { timestamps } from "@repo/database-runtime/schema/timestamps";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { ImportValidationError } from "../../application/ports/import-export-adapter.port";

import { importExportJobStatusEnum } from "./import-export-enums";

export const importJobs = pgTable(
  "t_import_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    type: text("type").notNull(),
    fileId: uuid("file_id").notNull(),
    status: importExportJobStatusEnum("status").notNull().default("PENDING"),
    rowCount: integer("row_count"),
    successCount: integer("success_count"),
    errorCount: integer("error_count"),
    errors: jsonb("errors").$type<ImportValidationError[] | null>(),
    /**
     * SHA-256 of the source file as validated at create time. Confirm recomputes
     * it and refuses the import when the stored object changed in between.
     */
    contentHash: text("content_hash"),
    createdById: uuid("created_by_id").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    idempotencyKey: text("idempotency_key"),
    ...timestamps,
  },
  (table) => [
    index("import_jobs_status_idx").on(table.status),
    index("import_jobs_created_by_id_idx").on(table.createdById),
    uniqueIndex("import_jobs_created_by_idempotency_key_unique")
      .on(table.createdById, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);

export const exportJobs = pgTable(
  "t_export_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    type: text("type").notNull(),
    status: importExportJobStatusEnum("status").notNull().default("PENDING"),
    fileId: uuid("file_id"),
    filters: jsonb("filters").$type<JsonObject | null>(),
    createdById: uuid("created_by_id").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    idempotencyKey: text("idempotency_key"),
    ...timestamps,
  },
  (table) => [
    index("export_jobs_status_idx").on(table.status),
    index("export_jobs_created_by_id_idx").on(table.createdById),
    uniqueIndex("export_jobs_created_by_idempotency_key_unique")
      .on(table.createdById, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
  ],
);
