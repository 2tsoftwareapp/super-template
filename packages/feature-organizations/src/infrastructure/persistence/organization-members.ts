import { timestamps } from "@repo/database-runtime";
import { index, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { organizationMemberRoleEnum } from "./organization-member-role.enum";
import { organizations } from "./organizations";

export const organizationMembers = pgTable(
  "r_organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // FK to feature-users.users is enforced at the SQL level by migration 0000.
    userId: uuid("user_id").notNull(),
    role: organizationMemberRoleEnum("role").notNull().default("MEMBER"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("organization_members_org_user_unique").on(table.organizationId, table.userId),
    index("organization_members_user_id_idx").on(table.userId),
    index("organization_members_organization_id_idx").on(table.organizationId),
  ],
);
