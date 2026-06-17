import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations } from '../identity/organizations';
import { users } from '../identity/users';
import { activityVisibilityEnum } from './enums';

export const activities = pgTable(
  'activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    summary: text('summary').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    visibility: activityVisibilityEnum('visibility')
      .notNull()
      .default('INTERNAL'),
    metadata: jsonb('metadata').$type<Record<string, unknown> | null>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('activities_entity_idx').on(table.entityType, table.entityId),
    index('activities_actor_id_idx').on(table.actorId),
    index('activities_created_at_idx').on(table.createdAt),
  ],
);
