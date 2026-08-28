import type { JsonObject } from "@repo/api-kernel";

import { timestamps } from "@repo/database-runtime/schema/timestamps";
import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const applicationSettings = pgTable("m_application_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<JsonObject>().notNull(),
  updatedById: uuid("updated_by_id"),
  ...timestamps,
});
