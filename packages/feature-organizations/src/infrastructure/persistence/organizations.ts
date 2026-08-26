import { timestamps } from "@repo/database-runtime";
import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { organizationMemberRoleEnum } from "./organizations-enums";

export const organizations = pgTable(
  "m_organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("organizations_slug_active_unique")
      .on(table.slug)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export const organizationMembers = pgTable(
  "r_organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull(),
    role: organizationMemberRoleEnum("role").notNull().default("MEMBER"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("organization_members_org_user_unique").on(table.organizationId, table.userId),
    index("organization_members_user_id_idx").on(table.userId),
    index("organization_members_organization_id_idx").on(table.organizationId),
  ],
);
