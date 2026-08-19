import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../shared/timestamps";

/**
 * Ledger of every object that was uploaded to object storage. Rows are written
 * best-effort by the tracking ObjectStorage wrapper: 'UPLOADED' on upload,
 * 'DELETED' once the object is confirmed gone. A periodic cleanup worker
 * sweeps rows still 'UPLOADED' past a grace period when no live file or file
 * version references the key (crash between upload and DB insert, or a storage
 * delete that failed and was never retried).
 *
 * Platform infrastructure table: no tenant column and no RLS policy (same as
 * `outbox_messages`). Only the tracking wrapper and the cleanup worker touch
 * it; the sweep's reference checks run with RLS bypass so live files in every
 * organization are seen.
 */
export const storageObjects = pgTable("storage_objects", {
  storageKey: text("storage_key").primaryKey(),
  status: text("status").notNull().default("UPLOADED"),
  ...timestamps,
});

/**
 * Retry queue for storage deletes that failed. The cleanup worker claims
 * PENDING rows, retries the delete, and marks DONE / FAILED (max attempts).
 */
export const storageDeleteOutbox = pgTable("storage_delete_outbox", {
  id: uuid("id").defaultRandom().primaryKey(),
  storageKey: text("storage_key").notNull().unique(),
  status: text("status").notNull().default("PENDING"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
