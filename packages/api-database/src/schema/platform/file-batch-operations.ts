import type { JsonObject } from '@repo/api-core';

import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { organizations } from '../identity/organizations';
import { users } from '../identity/users';

export const fileBatchOperations = pgTable(
  'file_batch_operations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'restrict' }),
    actorId: uuid('actor_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    operation: text('operation').notNull(),
    idempotencyKey: text('idempotency_key'),
    results: jsonb('results').$type<JsonObject[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('file_batch_operations_actor_idempotency_key_unique')
      .on(table.actorId, table.idempotencyKey)
      .where(sql`${table.idempotencyKey} is not null`),
    index('file_batch_operations_organization_id_idx').on(
      table.organizationId,
    ),
  ],
);
