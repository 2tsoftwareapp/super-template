import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "../shared/timestamps";
import { userStatusEnum } from "./enums";

export const users = pgTable(
  "m_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    avatarFileId: uuid("avatar_file_id"),
    status: userStatusEnum("status").notNull().default("PENDING"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_active_unique")
      .on(table.email)
      .where(sql`${table.deletedAt} is null`),
  ],
);
