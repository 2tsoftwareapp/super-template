import { timestamps } from "@repo/database-runtime/schema/timestamps";
import { organizations } from "@repo/feature-organizations/schema";
import { users } from "@repo/feature-users/schema";
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const files = pgTable(
  "m_files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    storageKey: text("storage_key").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    /** SHA-256 hex digest of the current (latest) version's content. */
    checksum: text("checksum"),
    /** Mirrors the highest `file_versions.version_number` for this file. */
    latestVersion: integer("latest_version").notNull().default(1),
    kind: text("kind").notNull().default("GENERIC"),
    visibility: text("visibility").notNull().default("TENANT"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("files_organization_id_idx").on(table.organizationId),
    index("files_uploaded_by_id_idx").on(table.uploadedById),
    index("files_storage_key_idx").on(table.storageKey),
    index("files_mime_type_idx").on(table.mimeType),
    index("files_created_at_idx").on(table.createdAt),
  ],
);
