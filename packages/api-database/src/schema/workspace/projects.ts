import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { organizations } from '../identity/organizations';
import { users } from '../identity/users';
import { timestamps } from '../shared/timestamps';
import { projectStatusEnum } from './enums';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    description: text('description'),
    status: projectStatusEnum('status').notNull().default('DRAFT'),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdById: uuid('created_by_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    updatedById: uuid('updated_by_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('projects_owner_name_active_unique')
      .on(table.ownerId, table.name)
      .where(sql`${table.deletedAt} is null`),
    index('projects_organization_id_idx').on(table.organizationId),
    index('projects_owner_id_idx').on(table.ownerId),
    index('projects_status_idx').on(table.status),
  ],
);
