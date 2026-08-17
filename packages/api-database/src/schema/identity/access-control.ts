import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "../shared/timestamps";
import { organizations } from "./organizations";
import { users } from "./users";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("roles_platform_name_unique")
      .on(table.name)
      .where(sql`${table.organizationId} is null`),
    uniqueIndex("roles_organization_name_lower_unique")
      .on(table.organizationId, sql`LOWER(${table.name})`)
      .where(sql`${table.isSystem} = false`),
    uniqueIndex("roles_org_system_name_unique")
      .on(table.organizationId, sql`LOWER(${table.name})`)
      .where(sql`${table.isSystem} = true AND ${table.organizationId} IS NOT NULL`),
    index("roles_organization_id_idx").on(table.organizationId),
  ],
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    scope: text("scope").notNull(),
    ...timestamps,
  },
  (table) => [
    check("permissions_scope_check", sql`${table.scope} IN ('platform', 'organization')`),
  ],
);

export const userRoles = pgTable(
  "user_roles",
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

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
    index("role_permissions_role_id_idx").on(table.roleId),
    index("role_permissions_permission_id_idx").on(table.permissionId),
  ],
);
