import { timestamps } from "@repo/database-runtime/schema/timestamps";
import { users } from "@repo/feature-users/schema";
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
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: organizationMemberRoleEnum("role").notNull().default("MEMBER"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("organization_members_org_user_unique").on(table.organizationId, table.userId),
    index("organization_members_user_id_idx").on(table.userId),
    index("organization_members_organization_id_idx").on(table.organizationId),
  ],
);
