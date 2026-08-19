import type { JsonObject } from "@repo/api-core";

import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { users } from "../identity/users";
import { timestamps } from "../shared/timestamps";

export const applicationSettings = pgTable("application_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<JsonObject>().notNull(),
  updatedById: uuid("updated_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  ...timestamps,
});
