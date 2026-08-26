import { roles } from "@repo/feature-access-control/schema";
import { organizations } from "@repo/feature-organizations/schema";
import { index, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const userRoles = pgTable(
  "r_user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
    index("user_roles_user_id_idx").on(table.userId),
    index("user_roles_role_id_idx").on(table.roleId),
    index("user_roles_organization_id_idx").on(table.organizationId),
  ],
);
