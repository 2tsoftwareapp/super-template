import { timestamps } from "@repo/database-runtime";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { files } from "./files";

export const attachments = pgTable(
  "r_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull(),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    label: text("label"),
    createdById: uuid("created_by_id"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("attachments_entity_idx").on(table.entityType, table.entityId),
    index("attachments_file_id_idx").on(table.fileId),
  ],
);
