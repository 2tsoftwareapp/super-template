import type { JsonObject } from "@repo/api-kernel";

import { timestamps } from "@repo/database-runtime";
import { jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const userPreferences = pgTable("m_user_preferences", {
  userId: uuid("user_id")
    .primaryKey(),
  theme: text("theme").notNull().default("system"),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),
  notificationPreferences: jsonb("notification_preferences")
    .$type<JsonObject>()
    .notNull()
    .default({}),
  emailPreferences: jsonb("email_preferences").$type<JsonObject>().notNull().default({}),
  ...timestamps,
});
